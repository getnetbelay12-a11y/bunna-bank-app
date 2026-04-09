import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Member, MemberSchema } from '../members/schemas/member.schema';
import {
  AutopaySetting,
  AutopaySettingSchema,
} from '../service-placeholders/schemas/autopay-setting.schema';
import {
  EMAIL_NOTIFICATION_PROVIDER,
  MOBILE_PUSH_NOTIFICATION_PROVIDER,
  IN_APP_NOTIFICATION_PROVIDER,
  SMS_NOTIFICATION_PROVIDER,
  TELEGRAM_NOTIFICATION_PROVIDER,
} from './channel-notification-provider.port';
import { CreateNotificationDto } from './dto';
import { DeviceTokensController } from './device-tokens.controller';
import { DeviceTokensService } from './device-tokens.service';
import { ManagerNotificationsController } from './manager-notifications.controller';
import { NotificationCampaignService } from './notification-campaign.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationsController } from './notifications.controller';
import { NotificationProviderService } from './notification-provider.service';
import {
  NOTIFICATION_PROVIDER_PORT,
} from './notification-provider.port';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationsService } from './notifications.service';
import { InAppNotificationProvider } from './providers/in-app-notification.provider';
import { EmailNotificationProvider } from './providers/email-notification.provider';
import { MobilePushNotificationProvider } from './providers/mobile-push-notification.provider';
import { SmsNotificationProvider } from './providers/sms-notification.provider';
import { TelegramNotificationProvider } from './providers/telegram-notification.provider';
import { TelegramSubscriptionController } from './telegram-subscription.controller';
import { TelegramSubscriptionService } from './telegram-subscription.service';
import { TemplateRendererService } from './template-renderer.service';
import { NotificationCampaign, NotificationCampaignSchema } from './schemas/notification-campaign.schema';
import { NotificationLog, NotificationLogSchema } from './schemas/notification-log.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { DeviceToken, DeviceTokenSchema } from './schemas/device-token.schema';
import {
  NotificationTemplate,
  NotificationTemplateSchema,
} from './schemas/notification-template.schema';
import {
  TelegramLinkCode,
  TelegramLinkCodeSchema,
} from './schemas/telegram-link-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
      { name: NotificationCampaign.name, schema: NotificationCampaignSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: TelegramLinkCode.name, schema: TelegramLinkCodeSchema },
      { name: Member.name, schema: MemberSchema },
      { name: AutopaySetting.name, schema: AutopaySettingSchema },
    ]),
  ],
  controllers: [
    NotificationsController,
    DeviceTokensController,
    ManagerNotificationsController,
    TelegramSubscriptionController,
  ],
  providers: [
    NotificationsService,
    DeviceTokensService,
    NotificationProviderService,
    NotificationTemplateService,
    NotificationDeliveryService,
    NotificationCampaignService,
    TelegramSubscriptionService,
    TemplateRendererService,
    EmailNotificationProvider,
    MobilePushNotificationProvider,
    SmsNotificationProvider,
    TelegramNotificationProvider,
    InAppNotificationProvider,
    {
      provide: NOTIFICATION_PROVIDER_PORT,
      useExisting: NotificationProviderService,
    },
    {
      provide: MOBILE_PUSH_NOTIFICATION_PROVIDER,
      useExisting: MobilePushNotificationProvider,
    },
    {
      provide: EMAIL_NOTIFICATION_PROVIDER,
      useExisting: EmailNotificationProvider,
    },
    {
      provide: SMS_NOTIFICATION_PROVIDER,
      useExisting: SmsNotificationProvider,
    },
    {
      provide: TELEGRAM_NOTIFICATION_PROVIDER,
      useExisting: TelegramNotificationProvider,
    },
    {
      provide: IN_APP_NOTIFICATION_PROVIDER,
      useExisting: InAppNotificationProvider,
    },
  ],
  exports: [
    NotificationsService,
    DeviceTokensService,
    NotificationTemplateService,
    NotificationCampaignService,
    NotificationDeliveryService,
    TelegramSubscriptionService,
    TemplateRendererService,
    EmailNotificationProvider,
    MobilePushNotificationProvider,
    SmsNotificationProvider,
    TelegramNotificationProvider,
  ],
})
export class NotificationsModule {}
