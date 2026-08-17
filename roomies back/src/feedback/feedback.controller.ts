import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

// Отзыв пишется руками и редко — десяти в час хватает любому живому человеку,
// а вот забить таблицу автоматом это уже не даёт. В dev лимит не режем:
// там форму дёргают подряд при проверке.
const isProduction = process.env.NODE_ENV === 'production';
const CREATE_LIMIT = isProduction ? 10 : 100;

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Throttle({ default: { limit: CREATE_LIMIT, ttl: 60 * 60_000 } })
  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отправить отзыв о приложении' })
  create(@CurrentUser() user: { id: number }, @Body() dto: CreateFeedbackDto) {
    return this.feedback.create(user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Свои отправленные отзывы' })
  listMine(@CurrentUser() user: { id: number }) {
    return this.feedback.listMine(user.id);
  }
}
