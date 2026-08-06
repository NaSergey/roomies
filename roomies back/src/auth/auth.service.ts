import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokensDto } from './dto/telegram-login.dto';
import { LoginDto, RegisterDto } from './dto/email-auth.dto';
import { hashPassword, needsRehash, verifyPassword } from './password';
import { JWT_AUDIENCE, JWT_ISSUER, type JwtPayload } from './jwt-auth.guard';
import {
  InvalidInitDataError,
  ParsedInitData,
  TelegramUser,
  verifyTelegramInitData,
} from './telegram-init-data';

// Хеш заведомо несуществующего пароля. Прогоняем его, когда email не найден,
// чтобы время ответа не отличалось от «email есть, пароль неверный» — иначе
// по таймингу перебирается база зарегистрированных адресов.
const DUMMY_HASH = hashPassword('dummy-password-for-constant-time-compare');

type AuthUser = {
  id: number;
  publicId: string;
  telegramId: bigint | null;
  tokenVersion: number;
};

const AUTH_USER_SELECT = {
  id: true,
  publicId: true,
  telegramId: true,
  tokenVersion: true,
} as const;

@Injectable()
export class AuthService {
  private readonly botToken: string;
  private readonly accessTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.botToken = config.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.accessTtlSeconds = Number(
      config.get<string>('JWT_ACCESS_TTL_SECONDS') ?? 60 * 60 * 24 * 7,
    );
  }

  async loginWithTelegram(initData: string): Promise<AuthTokensDto> {
    let parsed: ParsedInitData;
    try {
      parsed = verifyTelegramInitData(initData, this.botToken);
    } catch (e) {
      if (e instanceof InvalidInitDataError) {
        throw new UnauthorizedException(e.message);
      }
      throw e;
    }

    // Реферальная ссылка Mini App: t.me/<bot>?startapp=ref_<publicId>.
    // Telegram кладёт значение startapp в start_param внутрь подписанного
    // initData, поэтому код приходит уже проверенным HMAC — подделать чужое
    // авторство приглашения нельзя.
    const referralCode = parseReferralCode(parsed.raw.start_param);

    const { user, isNew } = await this.upsertTelegramUser(
      parsed.user,
      referralCode,
    );
    return this.issueTokens(user, isNew);
  }

  async registerWithEmail(dto: RegisterDto): Promise<AuthTokensDto> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email уже зарегистрирован');
    }

    const created = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(dto.password),
        name: dto.name.trim().slice(0, 100),
        // scenario обязателен в схеме — задаём дефолт, пользователь поменяет в онбординге.
        scenario: 'looking_housing_roomie',
        lastSeenAt: new Date(),
      },
      select: AUTH_USER_SELECT,
    });

    return this.issueTokens(created, true);
  }

  async loginWithEmail(dto: LoginDto): Promise<AuthTokensDto> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { ...AUTH_USER_SELECT, passwordHash: true, isActive: true },
    });

    // Сверку выполняем ВСЕГДА, даже если пользователя нет, — постоянное время ответа.
    const storedHash = user?.passwordHash ?? DUMMY_HASH;
    const passwordOk = verifyPassword(dto.password, storedHash);

    if (!user || !user.passwordHash || !passwordOk || !user.isActive) {
      // Единая формулировка: не раскрываем, существует ли email и активен ли аккаунт.
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Пароль верен, но хеш в устаревшем формате/со слабыми параметрами — пересохраняем.
    const dataToUpdate: { lastSeenAt: Date; passwordHash?: string } = {
      lastSeenAt: new Date(),
    };
    if (needsRehash(user.passwordHash)) {
      dataToUpdate.passwordHash = hashPassword(dto.password);
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
    });

    return this.issueTokens(user, false);
  }

  // «Выйти со всех устройств»: инкремент tokenVersion мгновенно обесценивает все
  // ранее выданные JWT этого пользователя (см. JwtAuthGuard) и выдаёт свежий.
  async revokeAllSessions(userId: number): Promise<AuthTokensDto> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
      select: AUTH_USER_SELECT,
    });
    return this.issueTokens(updated, false);
  }

  private async issueTokens(
    user: AuthUser,
    isNew: boolean,
  ): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      // sub — непрозрачный publicId, а НЕ автоинкрементный id: иначе токен,
      // выписанный до пересоздания базы, начинает указывать на другого человека.
      sub: user.publicId,
      tv: user.tokenVersion,
      ...(user.telegramId !== null ? { tg: user.telegramId.toString() } : {}),
    };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.accessTtlSeconds,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return {
      accessToken,
      expiresIn: this.accessTtlSeconds,
      userId: user.id,
      telegramId: user.telegramId !== null ? user.telegramId.toString() : null,
      isNew,
    };
  }

  private async upsertTelegramUser(tg: TelegramUser, referralCode?: string) {
    const telegramId = BigInt(tg.id);
    const displayName =
      [tg.first_name, tg.last_name].filter(Boolean).join(' ').trim() ||
      tg.username ||
      `tg_${tg.id}`;

    const existing = await this.prisma.user.findUnique({
      where: { telegramId },
      select: { ...AUTH_USER_SELECT, isActive: true },
    });

    if (existing) {
      if (!existing.isActive) {
        throw new UnauthorizedException('Аккаунт деактивирован');
      }
      await this.prisma.user.update({
        where: { telegramId },
        data: {
          telegramUsername: tg.username ?? null,
          telegramPhotoUrl: tg.photo_url ?? null,
          languageCode: tg.language_code ?? null,
          lastSeenAt: new Date(),
        },
      });
      return { user: existing, isNew: false };
    }

    // Пригласившего ищем ТОЛЬКО при создании аккаунта: связь одноразовая, иначе
    // повторный вход по чужой ссылке переписывал бы авторство приглашения.
    const referrerId = referralCode
      ? await this.findReferrerId(referralCode)
      : null;

    const created = await this.prisma.user.create({
      data: {
        telegramId,
        telegramUsername: tg.username ?? null,
        telegramPhotoUrl: tg.photo_url ?? null,
        languageCode: tg.language_code ?? null,
        name: displayName.slice(0, 100),
        // scenario обязателен в схеме — задаём дефолт, пользователь поменяет в онбординге.
        scenario: 'looking_housing_roomie',
        lastSeenAt: new Date(),
        ...(referrerId !== null ? { referredById: referrerId } : {}),
      },
      select: AUTH_USER_SELECT,
    });
    return { user: created, isNew: true };
  }

  // Код реферала — publicId пригласившего. Несуществующий код просто
  // игнорируем: регистрация из-за битой ссылки падать не должна.
  private async findReferrerId(code: string): Promise<number | null> {
    const referrer = await this.prisma.user.findUnique({
      where: { publicId: code },
      select: { id: true, isActive: true },
    });
    return referrer?.isActive ? referrer.id : null;
  }
}

// start_param приходит как ref_<publicId>. Формат publicId — uuid v4, поэтому
// проверяем его строго: в поле лежит произвольная строка от клиента Telegram, и
// пускать её в запрос к базе без валидации не стоит.
const REFERRAL_PREFIX = 'ref_';
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseReferralCode(startParam?: string): string | undefined {
  if (!startParam?.startsWith(REFERRAL_PREFIX)) return undefined;
  const code = startParam.slice(REFERRAL_PREFIX.length);
  return UUID_RE.test(code) ? code : undefined;
}
