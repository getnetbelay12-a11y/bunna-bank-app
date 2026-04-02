import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  accessTokenExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  jwtIssuer: 'cbe-bank-api',
  jwtAudience: 'cbe-bank-clients',
  jwtSecret: process.env.JWT_SECRET ?? 'CHANGE_THIS_SECRET',
}));
