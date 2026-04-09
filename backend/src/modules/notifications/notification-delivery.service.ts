import { Inject, Injectable } from '@nestjs/common';

import {
  NotificationCategory,
  NotificationChannel,
  NotificationLogStatus,
  NotificationStatus,
  UserRole,
} from '../../common/enums';
import { buildReminderInAppNotification } from './banking-notification-builders';
import { NotificationsService } from './notifications.service';
import {
  ChannelNotificationResult,
  EMAIL_NOTIFICATION_PROVIDER,
  MOBILE_PUSH_NOTIFICATION_PROVIDER,
  SMS_NOTIFICATION_PROVIDER,
  TELEGRAM_NOTIFICATION_PROVIDER,
  type ChannelNotificationPayload,
  type ChannelNotificationProvider,
} from './channel-notification-provider.port';

@Injectable()
export class NotificationDeliveryService {
  constructor(
    @Inject(EMAIL_NOTIFICATION_PROVIDER)
    private readonly emailProvider: ChannelNotificationProvider,
    @Inject(SMS_NOTIFICATION_PROVIDER)
    private readonly smsProvider: ChannelNotificationProvider,
    @Inject(TELEGRAM_NOTIFICATION_PROVIDER)
    private readonly telegramProvider: ChannelNotificationProvider,
    @Inject(MOBILE_PUSH_NOTIFICATION_PROVIDER)
    private readonly mobilePushProvider: ChannelNotificationProvider,
    private readonly notificationsService: NotificationsService,
  ) {}

  async deliver(
    payload: ChannelNotificationPayload & {
      userRole?: UserRole;
      createInAppRecord?: boolean;
    },
  ): Promise<ChannelNotificationResult> {
    if (
      payload.channel === NotificationChannel.MOBILE_PUSH ||
      payload.channel === NotificationChannel.IN_APP
    ) {
      const result = await this.mobilePushProvider.send({
        ...payload,
        channel: NotificationChannel.MOBILE_PUSH,
      });

      if (payload.createInAppRecord ?? true) {
        const notification = buildReminderInAppNotification({
          category: payload.category,
          subject: payload.subject,
          messageBody: payload.messageBody,
        });
        await this.notificationsService.storeNotificationRecord({
          userType: 'member',
          userId: payload.memberId,
          userRole: payload.userRole,
          type: notification.type,
          channel: NotificationChannel.MOBILE_PUSH,
          status:
            result.status === 'failed'
              ? NotificationStatus.FAILED
              : NotificationStatus.SENT,
          title: notification.title,
          message: notification.message,
          actionLabel: payload.actionLabel,
          deepLink: payload.deepLink,
          dataPayload: payload.dataPayload,
          deliveredAt:
            result.status === 'failed' ? undefined : new Date(),
        });
      }

      return result;
    }

    return this.resolveProvider(payload.channel).send(payload);
  }

  private resolveProvider(channel: NotificationChannel) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.emailProvider;
      case NotificationChannel.SMS:
        return this.smsProvider;
      case NotificationChannel.TELEGRAM:
        return this.telegramProvider;
      case NotificationChannel.MOBILE_PUSH:
      case NotificationChannel.IN_APP:
        return this.mobilePushProvider;
    }
  }

  toLogStatus(result: ChannelNotificationResult): NotificationLogStatus {
    switch (result.status) {
      case 'delivered':
        return NotificationLogStatus.DELIVERED;
      case 'sent':
        return NotificationLogStatus.SENT;
      default:
        return NotificationLogStatus.FAILED;
    }
  }
}
