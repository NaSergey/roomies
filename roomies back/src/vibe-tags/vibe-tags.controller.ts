import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VibeTagsService } from './vibe-tags.service';

@ApiTags('vibe-tags')
@Controller('vibe-tags')
export class VibeTagsController {
  constructor(private readonly vibeTags: VibeTagsService) {}

  @Get()
  @ApiOperation({ summary: 'Все вайб-теги' })
  getAll() {
    return this.vibeTags.findAll();
  }
}
