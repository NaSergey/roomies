import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';

// Гейт для CRM-бэка аналитики (/admin/**): сначала обычная проверка JWT
// (см. JwtAuthGuard — подпись, tokenVersion, isActive), затем role === 'admin'.
// Роль выдаётся не через API, а вручную (см. scripts/make-admin.ts) — публичного
// пути «стать админом» в приложении нет и быть не должно.
@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(ctx);
    if (!authenticated) return false;

    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
