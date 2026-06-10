import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FeedModule } from './feed/feed.module';
import { GeoModule } from './geo/geo.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PrismaModule } from './prisma/prisma.module';
import { SwipeModule } from './swipe/swipe.module';
import { VibeTagsModule } from './vibe-tags/vibe-tags.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OnboardingModule,
    GeoModule,
    VibeTagsModule,
    FeedModule,
    SwipeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
