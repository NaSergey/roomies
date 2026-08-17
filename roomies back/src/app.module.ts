import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { SquadModule } from './squad/squad.module';
import { FeedModule } from './feed/feed.module';
import { FeedbackModule } from './feedback/feedback.module';
import { GeoModule } from './geo/geo.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { SwipeModule } from './swipe/swipe.module';
import { VibeTagsModule } from './vibe-tags/vibe-tags.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Базовый лимит на все маршруты. Точечные, куда более жёсткие лимиты на
    // /auth/login и /auth/register навешены через @Throttle в AuthController —
    // без них пароль перебирается неограниченно.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    OnboardingModule,
    GeoModule,
    VibeTagsModule,
    FeedModule,
    SwipeModule,
    ProfileModule,
    ChatModule,
    SquadModule,
    FeedbackModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
