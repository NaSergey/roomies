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
    // Step 1 — Guard: cannot swipe self
    if (dto.targetId === actorId) {
      throw new BadRequestException('Cannot swipe yourself');
    }

    // Step 2 — Guard: no duplicate swipe
    const existing = await this.prisma.swipe.findUnique({
      where: { actorId_targetId: { actorId, targetId: dto.targetId } },
    });
    if (existing) {
      throw new ConflictException('Already swiped this user');
    }

    // Step 3 — Create Swipe row
    await this.prisma.swipe.create({
      data: {
        actorId,
        targetId: dto.targetId,
        action: dto.action as SwipeAction,
      },
    });

    // Step 4 — Check for mutual like (only on like/super_like actions)
    if (dto.action === 'like' || dto.action === 'super_like') {
      const reverseSwipe = await this.prisma.swipe.findFirst({
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

        const match = await this.prisma.match.create({
          data: {
            user1Id,
            user2Id,
            matchScore: 0.5,
            hardScore: 1.0,
            lifestyleScore: null,
            vibeScore: null,
            behavioralScore: null,
          },
        });

        return { matched: true, matchId: match.id };
      }
    }

    return { matched: false };
  }
}
