import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module';
import { parseAllowedOrigins } from './config/environment.validation';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const appConfig = configService.getOrThrow<{
    port: number;
    host: string;
    corsOrigin: string;
    nodeEnv: string;
  }>('app');
  const trustProxy = configService.get<boolean>('APP_TRUST_PROXY') ?? false;
  const allowedOrigins = parseAllowedOrigins(appConfig.corsOrigin);
  const allowAnyOrigin = allowedOrigins.length === 0 || allowedOrigins.includes('*');

  if (trustProxy) {
    app.enable('trust proxy');
  }

  app.enableShutdownHooks();
  app.disable('x-powered-by');
  app.enableCors({
    origin: allowAnyOrigin ? true : allowedOrigins,
    credentials: !allowAnyOrigin,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  app.use((_: Request, response: Response, next: NextFunction) => {
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: true },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  await app.listen(appConfig.port, appConfig.host);
  logger.log(
    `API listening on http://${appConfig.host}:${appConfig.port} (${appConfig.nodeEnv})`,
  );
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start API', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
