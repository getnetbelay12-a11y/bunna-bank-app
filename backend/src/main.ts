import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<{
    port: number;
    host: string;
    corsOrigin?: string;
  }>('app');

  app.enableCors({
    origin: resolveCorsOrigin(appConfig.corsOrigin),
    credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(appConfig.port, appConfig.host);
}

function resolveCorsOrigin(corsOrigin?: string) {
  if (!corsOrigin || corsOrigin === '*') {
    return true;
  }

  const origins = corsOrigin
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return origins.length <= 1 ? origins[0] : origins;
}

void bootstrap();
