import { validateEnvironment } from './environment.validation';

describe('validateEnvironment', () => {
  const baseConfig = {
    NODE_ENV: 'development',
    PORT: '4008',
    MONGODB_URI: 'mongodb://localhost:27017/bunna_bank_app',
    JWT_SECRET: 'ChangeThisToALongRandomSecret123',
    OTP_SIGNING_SECRET: 'ChangeThisToALongRandomSecret123',
    CLIENT_APP_ORIGIN: 'http://localhost:5175',
    STORAGE_PROVIDER: 'local',
    SMS_ENABLED: 'true',
    SMS_PROVIDER: 'log',
    EMAIL_ENABLED: 'true',
    EMAIL_PROVIDER: 'log',
    PUSH_ENABLED: 'true',
    PUSH_PROVIDER: 'log',
  };

  it('requires generic SMS endpoint when generic_http is enabled', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        SMS_PROVIDER: 'generic_http',
        SMS_GENERIC_ENDPOINT: '',
      }),
    ).toThrow('SMS_GENERIC_ENDPOINT');
  });

  it('allows smtp email provider in production when fully configured', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        NODE_ENV: 'production',
        EMAIL_PROVIDER: 'smtp',
        EMAIL_SENDER: 'notifications@bunna-bank.local',
        EMAIL_SMTP_HOST: 'smtp.example.com',
        EMAIL_SMTP_USER: 'user',
        EMAIL_SMTP_PASS: 'pass',
      }),
    ).not.toThrow();
  });

  it('requires sender when smtp email provider is enabled', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        EMAIL_PROVIDER: 'smtp',
        EMAIL_SENDER: '',
        EMAIL_SMTP_HOST: 'smtp.example.com',
        EMAIL_SMTP_USER: 'user',
        EMAIL_SMTP_PASS: 'pass',
      }),
    ).toThrow('EMAIL_SENDER');
  });

  it('blocks firebase push provider in production', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        NODE_ENV: 'production',
        PUSH_PROVIDER: 'firebase',
        FIREBASE_PROJECT_ID: 'project-1',
        FIREBASE_CLIENT_EMAIL: 'firebase@example.com',
        FIREBASE_PRIVATE_KEY: 'private-key',
      }),
    ).toThrow('PUSH_PROVIDER=firebase is not production-ready');
  });
});
