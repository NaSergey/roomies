import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VibeTagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.vibeTag.findMany({ orderBy: { label: 'asc' } });
  }
}
