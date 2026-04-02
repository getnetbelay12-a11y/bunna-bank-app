import { Inject, Injectable } from '@nestjs/common';

import {
  NotificationCategory,
  NotificationChannel,
  NotificationLogStatus,
  NotificationType,
  UserRole,
} from '../../common/enums';
import { NotificationsService } from './notifications.service';
import {
  ChannelNotificationResult,
  EMAIL_NOTIFICATION_PROVIDER,
  IN_APP_NOTIFICATION_PROVIDER,
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
    @Inject(IN_APP_NOTIFICATION_PROVIDER)
    private readonly inAppProvider: ChannelNotificationProvider,
    private readonly notificationsService: NotificationsService,
  ) {}

  async deliver(
    payload: ChannelNotificationPayload & {
      userRole?: UserRole;
      createInAppRecord?: boolean;
    },
  ): Promise<ChannelNotificationResult> {
    if (payload.channel === NotificationChannel.IN_APP) {
      if (payload.createInAppRecord ?? true) {
        await this.notificationsService.createNotification({
          userType: 'member',
          userId: payload.memberId,
          userRole: payload.userRole,
          type:
            payload.category === NotificationCategory.INSURANCE
              ? NotificationType.INSURANCE
              : NotificationType.LOAN_STATUS,
          title: payload.subject ?? 'Bunna Bank reminder',
          message: payload.messageBody,
        });
      }

      return this.inAppProvider.send(payload);
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
      case NotificationChannel.IN_APP:
        return this.inAppProvider;
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
