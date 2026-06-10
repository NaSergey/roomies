import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { SwipeService } from './swipe.service';

@ApiTags('swipes')
@Controller('swipes')
export class SwipeController {
  constructor(private readonly swipe: SwipeService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Записать свайп и проверить взаимный лайк' })
  createSwipe(
    @CurrentUser() user: { id: number },
    @Body() dto: CreateSwipeDto,
  ) {
    return this.swipe.createSwipe(user.id, dto);
  }
}
