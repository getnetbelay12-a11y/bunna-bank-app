"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EmailNotificationProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailNotificationProvider = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const nodemailer_1 = __importDefault(require("nodemailer"));
const path_1 = __importDefault(require("path"));
let EmailNotificationProvider = EmailNotificationProvider_1 = class EmailNotificationProvider {
    constructor() {
        this.logger = new common_1.Logger(EmailNotificationProvider_1.name);
        this.logoCid = 'bunna-bank-logo';
        this.logoPath = path_1.default.resolve(__dirname, '..', '..', '..', '..', '..', 'assets', 'bunna_bank_logo.png');
        this.provider = process.env.EMAIL_PROVIDER ?? (process.env.MAIL_HOST ? 'smtp' : 'log');
        this.host = process.env.MAIL_HOST ?? process.env.EMAIL_SMTP_HOST;
        this.port = Number(process.env.MAIL_PORT ?? process.env.EMAIL_SMTP_PORT ?? 587);
        this.user = process.env.MAIL_USER ?? process.env.EMAIL_SMTP_USER;
        this.password = process.env.MAIL_PASSWORD ?? process.env.EMAIL_SMTP_PASS;
        this.from = process.env.MAIL_FROM ??
            process.env.EMAIL_SENDER ??
            'notifications@bunna-bank.local';
        this.secure = (process.env.MAIL_SECURE ?? process.env.EMAIL_SMTP_SECURE ?? 'false') === 'true';
    }
    async send(payload) {
        if (this.provider !== 'smtp') {
            return {
                status: 'failed',
                recipient: payload.recipient,
                errorMessage: 'SMTP delivery is not configured. Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, and MAIL_FROM.',
            };
        }
        if (!this.host || !this.user || !this.password || !this.from) {
            return {
                status: 'failed',
                recipient: payload.recipient,
                errorMessage: 'SMTP is not configured. Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, and MAIL_FROM.',
            };
        }
        try {
            const transport = nodemailer_1.default.createTransport({
                host: this.host,
                port: this.port,
                secure: this.secure,
                auth: {
                    user: this.user,
                    pass: this.password,
                },
            });
            const info = await transport.sendMail({
                from: `Bunna Bank <${this.from}>`,
                to: payload.recipient,
                subject: payload.subject ?? 'Bunna Bank Notification',
                text: payload.messageBody,
                html: payload.htmlBody ?? `<p>${this.escapeForHtml(payload.messageBody)}</p>`,
                attachments: this.buildAttachments(),
            });
            this.logger.log(`Email sent recipient=${payload.recipient} messageId=${info.messageId}`);
            return {
                status: 'sent',
                providerMessageId: info.messageId,
                recipient: payload.recipient,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown SMTP delivery failure.';
            this.logger.error(`Email send failed for ${payload.recipient}: ${message}`);
            return {
                status: 'failed',
                recipient: payload.recipient,
                errorMessage: message,
            };
        }
    }
    buildAttachments() {
        if (!(0, fs_1.existsSync)(this.logoPath)) {
            this.logger.warn(`Email logo file not found at ${this.logoPath}`);
            return [];
        }
        return [
            {
                filename: 'bunna-bank-logo.png',
                path: this.logoPath,
                cid: this.logoCid,
            },
        ];
    }
    escapeForHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
};
exports.EmailNotificationProvider = EmailNotificationProvider;
exports.EmailNotificationProvider = EmailNotificationProvider = EmailNotificationProvider_1 = __decorate([
    (0, common_1.Injectable)()
], EmailNotificationProvider);
//# sourceMappingURL=email-notification.provider.js.map