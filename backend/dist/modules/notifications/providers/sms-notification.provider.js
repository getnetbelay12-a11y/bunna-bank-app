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
var SmsNotificationProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsNotificationProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SmsNotificationProvider = SmsNotificationProvider_1 = class SmsNotificationProvider {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SmsNotificationProvider_1.name);
    }
    async send(payload) {
        const config = this.configService.getOrThrow('notifications');
        if (!config.sms.enabled) {
            return {
                status: 'failed',
                recipient: payload.recipient,
                errorMessage: 'SMS delivery is disabled.',
            };
        }
        if (config.sms.provider === 'generic_http') {
            if (!config.sms.endpoint) {
                return {
                    status: 'failed',
                    recipient: payload.recipient,
                    errorMessage: 'SMS generic HTTP endpoint is not configured.',
                };
            }
            const response = await fetch(config.sms.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(config.sms.apiKey
                        ? { Authorization: `Bearer ${config.sms.apiKey}` }
                        : {}),
                },
                body: JSON.stringify({
                    channel: 'sms',
                    senderId: config.sms.senderId,
                    recipient: payload.recipient,
                    memberId: payload.memberId,
                    category: payload.category,
                    subject: payload.subject,
                    messageBody: payload.messageBody,
                }),
            });
            if (!response.ok) {
                this.logger.warn(`SMS provider returned HTTP ${response.status} for ${payload.recipient}.`);
                return {
                    status: 'failed',
                    recipient: payload.recipient,
                    errorMessage: `SMS provider returned HTTP ${response.status}.`,
                };
            }
            return {
                status: 'sent',
                providerMessageId: `sms-${Date.now()}`,
                recipient: payload.recipient,
            };
        }
        return {
            status: 'failed',
            recipient: payload.recipient,
            errorMessage: 'SMS log mode does not deliver real messages. Configure SMS_PROVIDER=generic_http for outbound delivery.',
        };
    }
};
exports.SmsNotificationProvider = SmsNotificationProvider;
exports.SmsNotificationProvider = SmsNotificationProvider = SmsNotificationProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsNotificationProvider);
//# sourceMappingURL=sms-notification.provider.js.map