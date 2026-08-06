import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export const JWT_ISSUER = 'roomies-api';
export const JWT_AUDIENCE = 'roomies-app';

export interface JwtPayload {
  /** Непрозрачный User.publicId (uuid), НЕ автоинкрементный id. */
  sub: string;
  /** Эпоха токена: должна совпасть с User.tokenVersion, иначе токен отозван. */
  tv: number;
  /** Telegram id строкой; отсутствует у email/пароль-аккаунтов. */
  tg?: string;
}

export interface AuthenticatedRequest extends Request {
  user: { id: number; telegramId: bigint | null };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice('Bearer '.length).trim();

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (typeof payload.sub !== 'string' || typeof payload.tv !== 'number') {
      throw new UnauthorizedException('Malformed token payload');
    }

    // Валидной подписи НЕ достаточно: аккаунт мог быть удалён, деактивирован или
    // все его сессии отозваны. Плюс до перехода на publicId токен со старым
    // числовым id после пересоздания базы указывал на другого пользователя —
    // поэтому личность всегда подтверждаем запросом к БД (индексный lookup).
    const user = await this.prisma.user.findUnique({
      where: { publicId: payload.sub },
      select: { id: true, telegramId: true, tokenVersion: true, isActive: true },
    });

    if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    req.user = { id: user.id, telegramId: user.telegramId };
    return true;
  }
}
