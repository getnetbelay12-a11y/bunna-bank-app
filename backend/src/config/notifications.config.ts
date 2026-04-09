import { registerAs } from '@nestjs/config';

import { getExternalEmailSettings } from './external-email.config';
import { getExternalTelegramSettings } from './external-telegram.config';

function firstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

export const notificationsConfig = registerAs('notifications', () => {
  const externalEmail = getExternalEmailSettings();
  const externalTelegram = getExternalTelegramSettings();
  const emailSmtpHost = firstNonEmpty(
    process.env.EMAIL_SMTP_HOST,
    process.env.MAIL_HOST,
    externalEmail?.smtpHost,
  );
  const emailSmtpUser = firstNonEmpty(
    process.env.EMAIL_SMTP_USER,
    process.env.MAIL_USER,
    externalEmail?.smtpUser,
  );
  const emailSmtpPass = firstNonEmpty(
    process.env.EMAIL_SMTP_PASS,
    process.env.MAIL_PASSWORD,
    externalEmail?.smtpPass,
  );
  const configuredEmailProvider = firstNonEmpty(
    process.env.EMAIL_PROVIDER,
    externalEmail?.provider,
  );
  const resolvedEmailProvider =
    configuredEmailProvider === 'log' &&
    emailSmtpHost &&
    emailSmtpUser &&
    emailSmtpPass
      ? 'smtp'
      : configuredEmailProvider || 'log';

  return {
    sms: {
      enabled: (process.env.SMS_ENABLED ?? 'true') === 'true',
      provider: process.env.SMS_PROVIDER ?? 'log',
      senderId: process.env.SMS_SENDER_ID ?? 'AMHARA_BANK',
      endpoint: process.env.SMS_GENERIC_ENDPOINT ?? '',
      apiKey: process.env.SMS_GENERIC_API_KEY ?? '',
    },
    email: {
      enabled: (process.env.EMAIL_ENABLED ?? 'true') === 'true',
      provider: resolvedEmailProvider,
      sender:
        firstNonEmpty(process.env.EMAIL_SENDER, process.env.MAIL_FROM, externalEmail?.sender) ??
        'notifications@bunna-bank.local',
      endpoint: process.env.EMAIL_GENERIC_ENDPOINT ?? '',
      apiKey: process.env.EMAIL_GENERIC_API_KEY ?? '',
      smtpHost: emailSmtpHost,
      smtpPort: Number(
        firstNonEmpty(
          process.env.EMAIL_SMTP_PORT,
          process.env.MAIL_PORT,
          externalEmail?.smtpPort != null ? String(externalEmail.smtpPort) : undefined,
        ) || '587',
      ),
      smtpSecure:
        (firstNonEmpty(
          process.env.EMAIL_SMTP_SECURE,
          process.env.MAIL_SECURE,
          externalEmail?.smtpSecure != null
            ? String(externalEmail.smtpSecure)
            : undefined,
        ) || 'false') ===
        'true',
      smtpUser: emailSmtpUser,
      smtpPass: emailSmtpPass,
      testRecipient:
        process.env.TEST_EMAIL_RECIPIENT ??
        process.env.DEMO_NOTIFICATION_EMAIL ??
        'write2get@gmail.com',
      forceTestRecipient: process.env.EMAIL_FORCE_TEST_RECIPIENT ?? '',
      externalSourcePath: externalEmail?.sourcePath ?? '',
    },
    push: {
      enabled: (process.env.PUSH_ENABLED ?? 'true') === 'true',
      provider: process.env.PUSH_PROVIDER ?? 'log',
      endpoint: process.env.PUSH_GENERIC_ENDPOINT ?? '',
      apiKey: process.env.PUSH_GENERIC_API_KEY ?? '',
      iosSimulatorDevice: process.env.PUSH_IOS_SIMULATOR_DEVICE ?? 'booted',
      iosSimulatorBundleId:
        process.env.PUSH_IOS_SIMULATOR_BUNDLE_ID ?? 'com.getnetbelay.bunnaBankMobile',
      apnsTeamId: process.env.APNS_TEAM_ID ?? '',
      apnsKeyId: process.env.APNS_KEY_ID ?? '',
      apnsBundleId:
        process.env.APNS_BUNDLE_ID ?? 'com.getnetbelay.bunnaBankMobile',
      apnsPrivateKey: process.env.APNS_PRIVATE_KEY ?? '',
      apnsUseSandbox: (process.env.APNS_USE_SANDBOX ?? 'true') === 'true',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? '',
      firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
      firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY ?? '',
    },
    telegram: {
      enabled:
        (process.env.TELEGRAM_ENABLED ??
          String(Boolean(process.env.TELEGRAM_BOT_TOKEN || externalTelegram?.botToken))) ===
        'true',
      botToken: process.env.TELEGRAM_BOT_TOKEN ?? externalTelegram?.botToken ?? '',
      apiBase:
        process.env.TELEGRAM_BOT_API_BASE ??
        externalTelegram?.apiBase ??
        'https://api.telegram.org',
      forceTestChatId:
        process.env.TELEGRAM_FORCE_TEST_CHAT_ID ??
        externalTelegram?.forceTestChatId ??
        '',
      webhookSecret:
        process.env.TELEGRAM_WEBHOOK_SECRET ??
        process.env.TELEGRAM_WEBHOOK_TOKEN ??
        '',
      externalSourcePath: externalTelegram?.sourcePath ?? '',
    },
  };
});
