import { NotificationCategory, NotificationChannel } from '../../common/enums';

export interface ChannelNotificationAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  cid?: string;
}

export interface ChannelNotificationPayload {
  channel: NotificationChannel;
  recipient: string;
  memberId: string;
  category: NotificationCategory;
  subject?: string;
  messageBody: string;
  htmlBody?: string;
  actionLabel?: string;
  deepLink?: string;
  dataPayload?: Record<string, unknown>;
  attachments?: ChannelNotificationAttachment[];
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
export const MOBILE_PUSH_NOTIFICATION_PROVIDER = Symbol(
  'MOBILE_PUSH_NOTIFICATION_PROVIDER',
);
export const SMS_NOTIFICATION_PROVIDER = Symbol('SMS_NOTIFICATION_PROVIDER');
export const TELEGRAM_NOTIFICATION_PROVIDER = Symbol('TELEGRAM_NOTIFICATION_PROVIDER');
export const IN_APP_NOTIFICATION_PROVIDER = Symbol('IN_APP_NOTIFICATION_PROVIDER');
