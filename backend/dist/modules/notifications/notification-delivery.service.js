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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDeliveryService = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../common/enums");
const notifications_service_1 = require("./notifications.service");
const channel_notification_provider_port_1 = require("./channel-notification-provider.port");
let NotificationDeliveryService = class NotificationDeliveryService {
    constructor(emailProvider, smsProvider, telegramProvider, inAppProvider, notificationsService) {
        this.emailProvider = emailProvider;
        this.smsProvider = smsProvider;
        this.telegramProvider = telegramProvider;
        this.inAppProvider = inAppProvider;
        this.notificationsService = notificationsService;
    }
    async deliver(payload) {
        if (payload.channel === enums_1.NotificationChannel.IN_APP) {
            if (payload.createInAppRecord ?? true) {
                await this.notificationsService.createNotification({
                    userType: 'member',
                    userId: payload.memberId,
                    userRole: payload.userRole,
                    type: payload.category === enums_1.NotificationCategory.INSURANCE
                        ? enums_1.NotificationType.INSURANCE
                        : enums_1.NotificationType.LOAN_STATUS,
                    title: payload.subject ?? 'Bunna Bank reminder',
                    message: payload.messageBody,
                });
            }
            return this.inAppProvider.send(payload);
        }
        return this.resolveProvider(payload.channel).send(payload);
    }
    resolveProvider(channel) {
        switch (channel) {
            case enums_1.NotificationChannel.EMAIL:
                return this.emailProvider;
            case enums_1.NotificationChannel.SMS:
                return this.smsProvider;
            case enums_1.NotificationChannel.TELEGRAM:
                return this.telegramProvider;
            case enums_1.NotificationChannel.IN_APP:
                return this.inAppProvider;
        }
    }
    toLogStatus(result) {
        switch (result.status) {
            case 'delivered':
                return enums_1.NotificationLogStatus.DELIVERED;
            case 'sent':
                return enums_1.NotificationLogStatus.SENT;
            default:
                return enums_1.NotificationLogStatus.FAILED;
        }
    }
};
exports.NotificationDeliveryService = NotificationDeliveryService;
exports.NotificationDeliveryService = NotificationDeliveryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(channel_notification_provider_port_1.EMAIL_NOTIFICATION_PROVIDER)),
    __param(1, (0, common_1.Inject)(channel_notification_provider_port_1.SMS_NOTIFICATION_PROVIDER)),
    __param(2, (0, common_1.Inject)(channel_notification_provider_port_1.TELEGRAM_NOTIFICATION_PROVIDER)),
    __param(3, (0, common_1.Inject)(channel_notification_provider_port_1.IN_APP_NOTIFICATION_PROVIDER)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, notifications_service_1.NotificationsService])
], NotificationDeliveryService);
//# sourceMappingURL=notification-delivery.service.js.map