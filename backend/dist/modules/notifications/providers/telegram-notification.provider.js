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
var TelegramNotificationProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramNotificationProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let TelegramNotificationProvider = TelegramNotificationProvider_1 = class TelegramNotificationProvider {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TelegramNotificationProvider_1.name);
        this.enabled =
            this.configService.get('notifications.telegram.enabled') === true;
        this.botToken =
            this.configService.get('notifications.telegram.botToken') ?? '';
        this.apiBase =
            this.configService.get('notifications.telegram.apiBase') ??
                'https://api.telegram.org';
        this.forceTestChatId =
            this.configService.get('notifications.telegram.forceTestChatId') ?? '';
        this.logger.log(`Telegram config loaded tokenPresent=${this.botToken ? 'yes' : 'no'} apiBase=${this.apiBase} forceTestChatId=${this.forceTestChatId ? 'active' : 'inactive'}`);
    }
    async send(payload) {
        return this.sendTextMessage(payload.recipient, payload.messageBody);
    }
    async sendTextMessage(recipient, messageBody) {
        const resolvedRecipient = recipient.trim();
        if (!this.enabled || !this.botToken) {
            this.logger.warn(`Telegram send skipped tokenPresent=${this.botToken ? 'yes' : 'no'} enabled=${this.enabled} recipient=${resolvedRecipient || 'unavailable'}`);
            return {
                status: 'failed',
                recipient: resolvedRecipient || 'unavailable',
                errorMessage: 'Telegram bot token is missing.',
            };
        }
        if (!resolvedRecipient) {
            return {
                status: 'failed',
                recipient: 'unavailable',
                errorMessage: 'Telegram recipient chat ID not found.',
            };
        }
        const endpoint = `${this.apiBase.replace(/\/$/, '')}/bot${this.botToken}/sendMessage`;
        this.logger.log(`Telegram send starting recipient=${resolvedRecipient} apiBase=${this.apiBase} forceTestChatId=${this.forceTestChatId ? 'active' : 'inactive'}`);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: resolvedRecipient,
                    text: messageBody,
                    disable_web_page_preview: true,
                }),
            });
            const data = (await response.json().catch(() => null));
            this.logger.log(`Telegram API response status=${response.status} recipient=${resolvedRecipient}`);
            if (!response.ok || data?.ok === false) {
                return {
                    status: 'failed',
                    recipient: resolvedRecipient,
                    errorMessage: data?.description || 'Telegram API request failed.',
                };
            }
            return {
                status: 'sent',
                providerMessageId: data?.result?.message_id != null ? String(data.result.message_id) : undefined,
                recipient: resolvedRecipient,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Telegram API request failed.';
            this.logger.error(`Telegram API request failed recipient=${resolvedRecipient}: ${message}`, error instanceof Error ? error.stack : undefined);
            return {
                status: 'failed',
                recipient: resolvedRecipient,
                errorMessage: 'Telegram API request failed.',
            };
        }
    }
};
exports.TelegramNotificationProvider = TelegramNotificationProvider;
exports.TelegramNotificationProvider = TelegramNotificationProvider = TelegramNotificationProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TelegramNotificationProvider);
//# sourceMappingURL=telegram-notification.provider.js.map