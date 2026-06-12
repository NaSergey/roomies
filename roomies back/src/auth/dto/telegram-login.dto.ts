import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class TelegramLoginDto {
  @ApiProperty({
    description: 'Сырая строка initData из window.Telegram.WebApp.initData',
    example: 'query_id=...&user=%7B%22id%22%3A...%7D&auth_date=...&hash=...',
  })
  @IsString()
  @MinLength(1)
  initData!: string;
}

export class AuthTokensDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ description: 'Срок жизни access token в секундах' })
  expiresIn!: number;

  @ApiProperty({ description: 'Внутренний id пользователя' })
  userId!: number;

  @ApiProperty({ description: 'Telegram id (строкой — может выходить за Number)' })
  telegramId!: string;

  @ApiProperty({ description: 'true — аккаунт создан в этом запросе' })
  isNew!: boolean;
}
