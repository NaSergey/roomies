import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto, RegisterDto } from './dto/email-auth.dto';
import { AuthTokensDto, TelegramLoginDto } from './dto/telegram-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

// В dev постоянно создаются тестовые аккаунты и раз за разом проверяется вход,
// поэтому боевые лимиты там только мешают. Строгие значения — для production,
// где они и защищают от перебора.
const isProduction = process.env.NODE_ENV === 'production';
const LIMITS = {
  login: isProduction ? 5 : 100,
  register: isProduction ? 10 : 100,
  telegram: isProduction ? 20 : 200,
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // initData подписан HMAC бот-токена, перебор бессмыслен — лимит только против флуда.
  @Throttle({ default: { limit: LIMITS.telegram, ttl: 60_000 } })
  @Post('telegram')
  @HttpCode(200)
  @ApiOperation({ summary: 'Авторизация через Telegram Mini App initData' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'initData невалиден или просрочен' })
  loginTelegram(@Body() dto: TelegramLoginDto): Promise<AuthTokensDto> {
    return this.auth.loginWithTelegram(dto.initData);
  }

  // Создание аккаунтов — дороже и реже логина, поэтому лимит на час.
  @Throttle({ default: { limit: LIMITS.register, ttl: 60 * 60_000 } })
  @Post('register')
  @HttpCode(200)
  @ApiOperation({ summary: 'Регистрация через email/пароль (браузер, без Telegram)' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  @ApiResponse({ status: 409, description: 'Email уже зарегистрирован' })
  @ApiResponse({ status: 429, description: 'Слишком много попыток' })
  register(@Body() dto: RegisterDto): Promise<AuthTokensDto> {
    return this.auth.registerWithEmail(dto);
  }

  // Главный вектор брутфорса пароля — самый жёсткий лимит.
  @Throttle({ default: { limit: LIMITS.login, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Вход через email/пароль' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'Неверный email или пароль' })
  @ApiResponse({ status: 429, description: 'Слишком много попыток' })
  login(@Body() dto: LoginDto): Promise<AuthTokensDto> {
    return this.auth.loginWithEmail(dto);
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Отозвать все выданные токены аккаунта и получить новый для текущего устройства',
  })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  logoutAll(@CurrentUser() user: { id: number }): Promise<AuthTokensDto> {
    return this.auth.revokeAllSessions(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Текущий пользователь (sanity-check токена)' })
  me(@CurrentUser() user: { id: number; telegramId: bigint | null }) {
    return { id: user.id, telegramId: user.telegramId?.toString() ?? null };
  }
}
