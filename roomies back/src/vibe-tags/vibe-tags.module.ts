import { Module } from '@nestjs/common';
import { VibeTagsController } from './vibe-tags.controller';
import { VibeTagsService } from './vibe-tags.service';

@Module({
  controllers: [VibeTagsController],
  providers: [VibeTagsService],
})
export class VibeTagsModule {}
