"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsConfig = void 0;
const config_1 = require("@nestjs/config");
exports.notificationsConfig = (0, config_1.registerAs)('notifications', () => ({
    sms: {
        enabled: (process.env.SMS_ENABLED ?? 'true') === 'true',
        provider: process.env.SMS_PROVIDER ?? 'log',
        senderId: process.env.SMS_SENDER_ID ?? 'BUNNA_BANK',
        endpoint: process.env.SMS_GENERIC_ENDPOINT ?? '',
        apiKey: process.env.SMS_GENERIC_API_KEY ?? '',
    },
    email: {
        enabled: (process.env.EMAIL_ENABLED ?? 'true') === 'true',
        provider: process.env.EMAIL_PROVIDER ?? 'log',
        sender: process.env.EMAIL_SENDER ?? 'notifications@bunna-bank.local',
        endpoint: process.env.EMAIL_GENERIC_ENDPOINT ?? '',
        apiKey: process.env.EMAIL_GENERIC_API_KEY ?? '',
        smtpHost: process.env.EMAIL_SMTP_HOST ?? '',
        smtpPort: Number(process.env.EMAIL_SMTP_PORT ?? 587),
        smtpSecure: process.env.EMAIL_SMTP_SECURE === 'true',
        smtpUser: process.env.EMAIL_SMTP_USER ?? '',
        smtpPass: process.env.EMAIL_SMTP_PASS ?? '',
    },
    push: {
        enabled: (process.env.PUSH_ENABLED ?? 'true') === 'true',
        provider: process.env.PUSH_PROVIDER ?? 'log',
        endpoint: process.env.PUSH_GENERIC_ENDPOINT ?? '',
        apiKey: process.env.PUSH_GENERIC_API_KEY ?? '',
        firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? '',
        firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
        firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY ?? '',
    },
}));
//# sourceMappingURL=notifications.config.js.map