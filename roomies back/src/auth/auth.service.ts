import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokensDto } from './dto/telegram-login.dto';
import {
  InvalidInitDataError,
  TelegramUser,
  verifyTelegramInitData,
} from './telegram-init-data';
import type { JwtPayload } from './jwt-auth.guard';

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
    let parsed;
    try {
      parsed = verifyTelegramInitData(initData, this.botToken);
    } catch (e) {
      if (e instanceof InvalidInitDataError) {
        throw new UnauthorizedException(e.message);
      }
      throw e;
    }

    const { user, isNew } = await this.upsertUser(parsed.user);

    const payload: JwtPayload = {
      sub: user.id,
      tg: user.telegramId.toString(),
    };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.accessTtlSeconds,
    });

    return {
      accessToken,
      expiresIn: this.accessTtlSeconds,
      userId: user.id,
      telegramId: user.telegramId.toString(),
      isNew,
    };
  }

  private async upsertUser(tg: TelegramUser) {
    const telegramId = BigInt(tg.id);
    const displayName =
      [tg.first_name, tg.last_name].filter(Boolean).join(' ').trim() ||
      tg.username ||
      `tg_${tg.id}`;

    const existing = await this.prisma.user.findUnique({
      where: { telegramId },
      select: { id: true, telegramId: true },
    });

    if (existing) {
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
      },
      select: { id: true, telegramId: true },
    });
    return { user: created, isNew: true };
  }
}
