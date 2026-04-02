import { NotificationCategory, NotificationChannel } from '../../common/enums';

export interface ChannelNotificationPayload {
  channel: NotificationChannel;
  recipient: string;
  memberId: string;
  category: NotificationCategory;
  subject?: string;
  messageBody: string;
  htmlBody?: string;
}

export interface ChannelNotificationResult {
  status: 'sent' | 'delivered' | 'failed';
  providerMessageId?: string;
  errorMessage?: string;
  recipient: string;
}

export interface ChannelNotificationProvider {
  send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult>;
}

export const EMAIL_NOTIFICATION_PROVIDER = Symbol('EMAIL_NOTIFICATION_PROVIDER');
export const SMS_NOTIFICATION_PROVIDER = Symbol('SMS_NOTIFICATION_PROVIDER');
export const TELEGRAM_NOTIFICATION_PROVIDER = Symbol('TELEGRAM_NOTIFICATION_PROVIDER');
export const IN_APP_NOTIFICATION_PROVIDER = Symbol('IN_APP_NOTIFICATION_PROVIDER');
