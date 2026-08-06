import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

// JSON.stringify не умеет BigInt — приводим к строке.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

const isProduction = process.env.NODE_ENV === 'production';

// Слабый или дефолтный JWT_SECRET = любой может подписать токен от имени любого
// пользователя. Падаем на старте, а не после первого запроса.
function assertJwtSecret(): void {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET должен быть задан и содержать минимум 32 символа случайных данных',
    );
  }
}

async function bootstrap() {
  assertJwtSecret();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Базовые security-заголовки (X-Content-Type-Options, X-Frame-Options,
  // Strict-Transport-Security и т.д.). CSP отключаем глобально: это чистый
  // JSON API для отдельных фронтов на других origin (Mini App, будущая CRM),
  // а не HTML-рендерер — единственная HTML-поверхность (Swagger UI) есть
  // только в dev, и её ломает дефолтный inline-script запрет helmet'а; узкий
  // CSP для /uploads/* уже задан ниже отдельно. crossOriginResourcePolicy
  // расширяем до cross-origin — иначе браузер блокирует загрузку
  // /uploads/*.jpg с домена фронта (другой origin, чем API).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Загруженные фото профиля (см. ProfileController#uploadPhoto) — раздаём как статику.
  // nosniff + attachment: даже если в uploads попадёт файл с HTML внутри, браузер
  // не выполнит его как страницу на нашем origin (иначе — stored XSS).
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; img-src 'self'",
      );
    },
  });

  // Mini App открывается из Telegram через эфемерный домен (cloudflare-туннель и т.п.),
  // поэтому в dev пускаем любое origin. На проде отражать любой Origin нельзя —
  // требуем явный список и не даём молча уехать в прод с wildcard.
  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (isProduction && (!corsOrigins || corsOrigins.length === 0)) {
    throw new Error(
      'В production CORS_ORIGINS обязателен — wildcard-CORS запрещён',
    );
  }
  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger публикует всю поверхность API — в проде не выставляем.
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Roomies API')
      .setDescription('Roomies backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
