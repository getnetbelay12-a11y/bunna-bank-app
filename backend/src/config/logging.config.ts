import { registerAs } from '@nestjs/config';

export const loggingConfig = registerAs('logging', () => ({
  appName: process.env.APP_NAME ?? 'Bunna Bank API',
  level: process.env.APP_LOG_LEVEL ?? 'log',
}));
