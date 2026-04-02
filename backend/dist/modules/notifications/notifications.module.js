"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const member_schema_1 = require("../members/schemas/member.schema");
const channel_notification_provider_port_1 = require("./channel-notification-provider.port");
const manager_notifications_controller_1 = require("./manager-notifications.controller");
const notification_campaign_service_1 = require("./notification-campaign.service");
const notification_delivery_service_1 = require("./notification-delivery.service");
const notifications_controller_1 = require("./notifications.controller");
const notification_provider_service_1 = require("./notification-provider.service");
const notification_provider_port_1 = require("./notification-provider.port");
const notification_template_service_1 = require("./notification-template.service");
const notifications_service_1 = require("./notifications.service");
const in_app_notification_provider_1 = require("./providers/in-app-notification.provider");
const email_notification_provider_1 = require("./providers/email-notification.provider");
const sms_notification_provider_1 = require("./providers/sms-notification.provider");
const telegram_notification_provider_1 = require("./providers/telegram-notification.provider");
const template_renderer_service_1 = require("./template-renderer.service");
const notification_campaign_schema_1 = require("./schemas/notification-campaign.schema");
const notification_log_schema_1 = require("./schemas/notification-log.schema");
const notification_schema_1 = require("./schemas/notification.schema");
const notification_template_schema_1 = require("./schemas/notification-template.schema");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
                { name: notification_template_schema_1.NotificationTemplate.name, schema: notification_template_schema_1.NotificationTemplateSchema },
                { name: notification_campaign_schema_1.NotificationCampaign.name, schema: notification_campaign_schema_1.NotificationCampaignSchema },
                { name: notification_log_schema_1.NotificationLog.name, schema: notification_log_schema_1.NotificationLogSchema },
                { name: member_schema_1.Member.name, schema: member_schema_1.MemberSchema },
            ]),
        ],
        controllers: [notifications_controller_1.NotificationsController, manager_notifications_controller_1.ManagerNotificationsController],
        providers: [
            notifications_service_1.NotificationsService,
            notification_provider_service_1.NotificationProviderService,
            notification_template_service_1.NotificationTemplateService,
            notification_delivery_service_1.NotificationDeliveryService,
            notification_campaign_service_1.NotificationCampaignService,
            template_renderer_service_1.TemplateRendererService,
            email_notification_provider_1.EmailNotificationProvider,
            sms_notification_provider_1.SmsNotificationProvider,
            telegram_notification_provider_1.TelegramNotificationProvider,
            in_app_notification_provider_1.InAppNotificationProvider,
            {
                provide: notification_provider_port_1.NOTIFICATION_PROVIDER_PORT,
                useExisting: notification_provider_service_1.NotificationProviderService,
            },
            {
                provide: channel_notification_provider_port_1.EMAIL_NOTIFICATION_PROVIDER,
                useExisting: email_notification_provider_1.EmailNotificationProvider,
            },
            {
                provide: channel_notification_provider_port_1.SMS_NOTIFICATION_PROVIDER,
                useExisting: sms_notification_provider_1.SmsNotificationProvider,
            },
            {
                provide: channel_notification_provider_port_1.TELEGRAM_NOTIFICATION_PROVIDER,
                useExisting: telegram_notification_provider_1.TelegramNotificationProvider,
            },
            {
                provide: channel_notification_provider_port_1.IN_APP_NOTIFICATION_PROVIDER,
                useExisting: in_app_notification_provider_1.InAppNotificationProvider,
            },
        ],
        exports: [
            notifications_service_1.NotificationsService,
            notification_template_service_1.NotificationTemplateService,
            notification_campaign_service_1.NotificationCampaignService,
            notification_delivery_service_1.NotificationDeliveryService,
            template_renderer_service_1.TemplateRendererService,
        ],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map