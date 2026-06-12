import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { AuthTokensDto, TelegramLoginDto } from './dto/telegram-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('telegram')
  @HttpCode(200)
  @ApiOperation({ summary: 'Авторизация через Telegram Mini App initData' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'initData невалиден или просрочен' })
  loginTelegram(@Body() dto: TelegramLoginDto): Promise<AuthTokensDto> {
    return this.auth.loginWithTelegram(dto.initData);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Текущий пользователь (sanity-check токена)' })
  me(@CurrentUser() user: { id: number; telegramId: bigint }) {
    return { id: user.id, telegramId: user.telegramId.toString() };
  }
}
