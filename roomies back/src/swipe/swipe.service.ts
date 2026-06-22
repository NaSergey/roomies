import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { SwipeAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';

@Injectable()
export class SwipeService {
  constructor(private readonly prisma: PrismaService) {}

  async createSwipe(actorId: number, dto: CreateSwipeDto) {
    if (dto.targetId === actorId) {
      throw new BadRequestException('Cannot swipe yourself');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.swipe.findUnique({
        where: { actorId_targetId: { actorId, targetId: dto.targetId } },
      });
      if (existing) {
        throw new ConflictException('Already swiped this user');
      }

      await tx.swipe.create({
        data: {
          actorId,
          targetId: dto.targetId,
          action: dto.action as SwipeAction,
        },
      });

      if (dto.action === 'like' || dto.action === 'super_like') {
        const reverseSwipe = await tx.swipe.findFirst({
          where: {
            actorId: dto.targetId,
            targetId: actorId,
            action: { in: ['like', 'super_like'] },
          },
        });

        if (reverseSwipe) {
          // ENFORCE INVARIANT: user1Id < user2Id
          const user1Id = Math.min(actorId, dto.targetId);
          const user2Id = Math.max(actorId, dto.targetId);

          const match = await tx.match.upsert({
            where: { user1Id_user2Id: { user1Id, user2Id } },
            create: {
              user1Id,
              user2Id,
              matchScore: 0.5,
              hardScore: 1.0,
              lifestyleScore: null,
              vibeScore: null,
              behavioralScore: null,
              chat: { create: {} },
            },
            update: {},
          });

          return { matched: true, matchId: match.id };
        }
      }

      return { matched: false };
    });
  }
}
