"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TelegramNotificationProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramNotificationProvider = void 0;
const common_1 = require("@nestjs/common");
let TelegramNotificationProvider = TelegramNotificationProvider_1 = class TelegramNotificationProvider {
    constructor() {
        this.logger = new common_1.Logger(TelegramNotificationProvider_1.name);
    }
    async send(payload) {
        this.logger.warn(`Telegram delivery is not configured for ${payload.recipient}.`);
        return {
            status: 'failed',
            recipient: payload.recipient,
            errorMessage: 'Telegram delivery is not implemented in this repo yet.',
        };
    }
};
exports.TelegramNotificationProvider = TelegramNotificationProvider;
exports.TelegramNotificationProvider = TelegramNotificationProvider = TelegramNotificationProvider_1 = __decorate([
    (0, common_1.Injectable)()
], TelegramNotificationProvider);
//# sourceMappingURL=telegram-notification.provider.js.map