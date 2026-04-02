import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'Bunna Bank API',
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? process.env.APP_HOST ?? '0.0.0.0',
  demoMode: process.env.DEMO_MODE === 'true',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CLIENT_APP_ORIGIN ?? '*',
}));
