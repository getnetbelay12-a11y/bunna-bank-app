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
const autopay_setting_schema_1 = require("../service-placeholders/schemas/autopay-setting.schema");
const channel_notification_provider_port_1 = require("./channel-notification-provider.port");
const device_tokens_controller_1 = require("./device-tokens.controller");
const device_tokens_service_1 = require("./device-tokens.service");
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
const mobile_push_notification_provider_1 = require("./providers/mobile-push-notification.provider");
const sms_notification_provider_1 = require("./providers/sms-notification.provider");
const telegram_notification_provider_1 = require("./providers/telegram-notification.provider");
const telegram_subscription_controller_1 = require("./telegram-subscription.controller");
const telegram_subscription_service_1 = require("./telegram-subscription.service");
const template_renderer_service_1 = require("./template-renderer.service");
const notification_campaign_schema_1 = require("./schemas/notification-campaign.schema");
const notification_log_schema_1 = require("./schemas/notification-log.schema");
const notification_schema_1 = require("./schemas/notification.schema");
const device_token_schema_1 = require("./schemas/device-token.schema");
const notification_template_schema_1 = require("./schemas/notification-template.schema");
const telegram_link_code_schema_1 = require("./schemas/telegram-link-code.schema");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
                { name: device_token_schema_1.DeviceToken.name, schema: device_token_schema_1.DeviceTokenSchema },
                { name: notification_template_schema_1.NotificationTemplate.name, schema: notification_template_schema_1.NotificationTemplateSchema },
                { name: notification_campaign_schema_1.NotificationCampaign.name, schema: notification_campaign_schema_1.NotificationCampaignSchema },
                { name: notification_log_schema_1.NotificationLog.name, schema: notification_log_schema_1.NotificationLogSchema },
                { name: telegram_link_code_schema_1.TelegramLinkCode.name, schema: telegram_link_code_schema_1.TelegramLinkCodeSchema },
                { name: member_schema_1.Member.name, schema: member_schema_1.MemberSchema },
                { name: autopay_setting_schema_1.AutopaySetting.name, schema: autopay_setting_schema_1.AutopaySettingSchema },
            ]),
        ],
        controllers: [
            notifications_controller_1.NotificationsController,
            device_tokens_controller_1.DeviceTokensController,
            manager_notifications_controller_1.ManagerNotificationsController,
            telegram_subscription_controller_1.TelegramSubscriptionController,
        ],
        providers: [
            notifications_service_1.NotificationsService,
            device_tokens_service_1.DeviceTokensService,
            notification_provider_service_1.NotificationProviderService,
            notification_template_service_1.NotificationTemplateService,
            notification_delivery_service_1.NotificationDeliveryService,
            notification_campaign_service_1.NotificationCampaignService,
            telegram_subscription_service_1.TelegramSubscriptionService,
            template_renderer_service_1.TemplateRendererService,
            email_notification_provider_1.EmailNotificationProvider,
            mobile_push_notification_provider_1.MobilePushNotificationProvider,
            sms_notification_provider_1.SmsNotificationProvider,
            telegram_notification_provider_1.TelegramNotificationProvider,
            in_app_notification_provider_1.InAppNotificationProvider,
            {
                provide: notification_provider_port_1.NOTIFICATION_PROVIDER_PORT,
                useExisting: notification_provider_service_1.NotificationProviderService,
            },
            {
                provide: channel_notification_provider_port_1.MOBILE_PUSH_NOTIFICATION_PROVIDER,
                useExisting: mobile_push_notification_provider_1.MobilePushNotificationProvider,
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
            device_tokens_service_1.DeviceTokensService,
            notification_template_service_1.NotificationTemplateService,
            notification_campaign_service_1.NotificationCampaignService,
            notification_delivery_service_1.NotificationDeliveryService,
            telegram_subscription_service_1.TelegramSubscriptionService,
            template_renderer_service_1.TemplateRendererService,
            email_notification_provider_1.EmailNotificationProvider,
            mobile_push_notification_provider_1.MobilePushNotificationProvider,
            sms_notification_provider_1.SmsNotificationProvider,
            telegram_notification_provider_1.TelegramNotificationProvider,
        ],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map