import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Member, MemberSchema } from '../members/schemas/member.schema';
import {
  EMAIL_NOTIFICATION_PROVIDER,
  IN_APP_NOTIFICATION_PROVIDER,
  SMS_NOTIFICATION_PROVIDER,
  TELEGRAM_NOTIFICATION_PROVIDER,
} from './channel-notification-provider.port';
import { CreateNotificationDto } from './dto';
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
import { SmsNotificationProvider } from './providers/sms-notification.provider';
import { TelegramNotificationProvider } from './providers/telegram-notification.provider';
import { TemplateRendererService } from './template-renderer.service';
import { NotificationCampaign, NotificationCampaignSchema } from './schemas/notification-campaign.schema';
import { NotificationLog, NotificationLogSchema } from './schemas/notification-log.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import {
  NotificationTemplate,
  NotificationTemplateSchema,
} from './schemas/notification-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
      { name: NotificationCampaign.name, schema: NotificationCampaignSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [NotificationsController, ManagerNotificationsController],
  providers: [
    NotificationsService,
    NotificationProviderService,
    NotificationTemplateService,
    NotificationDeliveryService,
    NotificationCampaignService,
    TemplateRendererService,
    EmailNotificationProvider,
    SmsNotificationProvider,
    TelegramNotificationProvider,
    InAppNotificationProvider,
    {
      provide: NOTIFICATION_PROVIDER_PORT,
      useExisting: NotificationProviderService,
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
    NotificationTemplateService,
    NotificationCampaignService,
    NotificationDeliveryService,
    TemplateRendererService,
  ],
})
export class NotificationsModule {}
