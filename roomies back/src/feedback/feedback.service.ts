import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateFeedbackDto) {
    const created = await this.prisma.appFeedback.create({
      data: {
        userId,
        category: dto.category,
        message: dto.message,
        screen: dto.screen ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return { id: created.id, createdAt: created.createdAt };
  }

  // Свои отправленные отзывы. Нужны клиенту, чтобы после отправки показать
  // «мы получили» и не дать человеку писать одно и то же дважды вслепую.
  listMine(userId: number) {
    return this.prisma.appFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        category: true,
        message: true,
        handled: true,
        createdAt: true,
      },
    });
  }
}
