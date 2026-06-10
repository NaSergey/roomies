import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SwipeController } from './swipe.controller';
import { SwipeService } from './swipe.service';

@Module({
  imports: [AuthModule],
  controllers: [SwipeController],
  providers: [SwipeService],
})
export class SwipeModule {}
