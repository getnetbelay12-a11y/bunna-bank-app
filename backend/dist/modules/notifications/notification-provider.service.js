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
var NotificationProviderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProviderService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let NotificationProviderService = NotificationProviderService_1 = class NotificationProviderService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationProviderService_1.name);
    }
    async dispatch(payload) {
        const config = this.configService.getOrThrow('notifications');
        const channelResults = await Promise.all([
            this.dispatchPush(config.push, payload),
            this.dispatchSms(config.sms, payload),
            this.dispatchEmail(config.email, payload),
        ]);
        const enabledChannels = [
            config.push.enabled,
            config.sms.enabled,
            config.email.enabled,
        ].filter(Boolean).length;
        if (enabledChannels === 0) {
            this.logger.debug(`No outbound notification channels enabled for ${payload.userType}:${payload.userId}.`);
            return true;
        }
        return channelResults.some(Boolean);
    }
    async dispatchPush(config, payload) {
        if (!config.enabled) {
            return false;
        }
        if (config.provider === 'log') {
            this.logger.log(`Push notification queued in log mode for ${payload.userType}:${payload.userId} - ${payload.title}`);
            return true;
        }
        if (config.provider === 'generic_http') {
            return this.postToGenericEndpoint(config.endpoint, config.apiKey, {
                channel: 'push',
                ...payload,
            });
        }
        if (config.provider === 'firebase') {
            if (!config.firebaseProjectId ||
                !config.firebaseClientEmail ||
                !config.firebasePrivateKey) {
                this.logger.warn('Firebase push provider is enabled but FIREBASE_* credentials are incomplete.');
                return false;
            }
            this.logger.warn('Firebase provider is configured but no firebase-admin integration is installed in this PoC yet.');
            return false;
        }
        return false;
    }
    async dispatchSms(config, payload) {
        if (!config.enabled) {
            return false;
        }
        if (config.provider === 'log') {
            this.logger.log(`SMS notification queued in log mode for ${payload.userType}:${payload.userId} - ${payload.title}`);
            return true;
        }
        if (config.provider === 'generic_http') {
            return this.postToGenericEndpoint(config.endpoint, config.apiKey, {
                channel: 'sms',
                senderId: config.senderId,
                ...payload,
            });
        }
        return false;
    }
    async dispatchEmail(config, payload) {
        if (!config.enabled) {
            return false;
        }
        if (config.provider === 'log') {
            this.logger.log(`Email notification queued in log mode for ${payload.userType}:${payload.userId} - ${payload.title}`);
            return true;
        }
        if (config.provider === 'generic_http') {
            return this.postToGenericEndpoint(config.endpoint, config.apiKey, {
                channel: 'email',
                sender: config.sender,
                ...payload,
            });
        }
        if (config.provider === 'smtp') {
            if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
                this.logger.warn('SMTP email provider is enabled but EMAIL_SMTP_* settings are incomplete.');
                return false;
            }
            this.logger.warn('SMTP provider is configured but no SMTP transport is installed in this PoC yet.');
            return false;
        }
        return false;
    }
    async postToGenericEndpoint(endpoint, apiKey, payload) {
        if (!endpoint) {
            this.logger.warn('Generic notification endpoint is missing.');
            return false;
        }
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            this.logger.warn(`Generic notification endpoint returned HTTP ${response.status}.`);
            return false;
        }
        return true;
    }
};
exports.NotificationProviderService = NotificationProviderService;
exports.NotificationProviderService = NotificationProviderService = NotificationProviderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationProviderService);
//# sourceMappingURL=notification-provider.service.js.map