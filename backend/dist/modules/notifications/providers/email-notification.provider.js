"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EmailNotificationProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailNotificationProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
let EmailNotificationProvider = EmailNotificationProvider_1 = class EmailNotificationProvider {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EmailNotificationProvider_1.name);
        this.transport = null;
    }
    async send(payload) {
        const config = this.configService.getOrThrow('notifications.email');
        if (config.provider === 'log') {
            const messageId = `log-${Date.now()}`;
            this.logger.log(`Email reminder queued in log mode recipient=${payload.recipient} subject="${payload.subject ?? 'Bunna Bank Notification'}" messageId=${messageId} attachments=${payload.attachments?.length ?? 0}`);
            return {
                status: 'sent',
                recipient: payload.recipient,
                providerMessageId: messageId,
            };
        }
        if (config.provider !== 'smtp') {
            this.logger.warn(`Email provider misconfigured for recipient=${payload.recipient}. provider=${config.provider}`);
            return {
                status: 'failed',
                recipient: payload.recipient,
                errorMessage: 'Mail configuration missing. Set EMAIL_PROVIDER=smtp with valid SMTP settings, or use EMAIL_PROVIDER=log in local seeded mode.',
            };
        }
        if (!config.smtpHost || !config.smtpUser || !config.smtpPass || !config.sender) {
            this.logger.warn(`SMTP settings incomplete for recipient=${payload.recipient}. host=${Boolean(config.smtpHost)} user=${Boolean(config.smtpUser)} sender=${Boolean(config.sender)}`);
            return {
                status: 'failed',
                recipient: payload.recipient,
                errorMessage: 'Mail configuration missing. Set EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS, and EMAIL_SENDER.',
            };
        }
        try {
            const transport = this.getTransport(config);
            const logoAttachment = payload.attachments?.find((item) => item.cid);
            this.logger.log(`email delivery strategy=${logoAttachment ? 'cid' : 'inline_html'} recipient=${payload.recipient} cid=${logoAttachment?.cid ?? 'none'}`);
            const info = await transport.sendMail({
                from: `Bunna Bank <${config.sender}>`,
                to: payload.recipient,
                subject: payload.subject ?? 'Bunna Bank Notification',
                text: payload.messageBody,
                html: payload.htmlBody ?? `<p>${this.escapeForHtml(payload.messageBody)}</p>`,
                attachments: payload.attachments?.map((item) => ({
                    filename: item.filename,
                    content: item.content,
                    contentType: item.contentType,
                    cid: item.cid,
                })),
            });
            this.logger.log(`Email sent recipient=${payload.recipient} messageId=${info.messageId}`);
            return {
                status: 'sent',
                providerMessageId: info.messageId,
                recipient: payload.recipient,
            };
        }
        catch (error) {
            const message = this.buildDeliveryErrorMessage(error);
            this.logger.error(`Email send failed for ${payload.recipient}: ${message}`, error instanceof Error ? error.stack : undefined);
            return {
                status: 'failed',
                recipient: payload.recipient,
                errorMessage: message,
            };
        }
    }
    getTransport(config) {
        if (this.transport) {
            return this.transport;
        }
        this.transport = nodemailer_1.default.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
            auth: {
                user: config.smtpUser,
                pass: config.smtpPass,
            },
        });
        return this.transport;
    }
    escapeForHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    buildDeliveryErrorMessage(error) {
        if (!(error instanceof Error)) {
            return 'Unknown SMTP delivery failure.';
        }
        const nodeError = error;
        if (nodeError.code === 'EAUTH') {
            return 'SMTP authentication failed.';
        }
        if (nodeError.code === 'ECONNECTION' || nodeError.code === 'ETIMEDOUT') {
            return 'SMTP connection failed.';
        }
        if (nodeError.response) {
            return nodeError.response;
        }
        return nodeError.message;
    }
};
exports.EmailNotificationProvider = EmailNotificationProvider;
exports.EmailNotificationProvider = EmailNotificationProvider = EmailNotificationProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailNotificationProvider);
//# sourceMappingURL=email-notification.provider.js.map