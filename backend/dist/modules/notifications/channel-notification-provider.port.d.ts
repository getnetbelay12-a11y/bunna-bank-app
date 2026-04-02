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
export declare const EMAIL_NOTIFICATION_PROVIDER: unique symbol;
export declare const SMS_NOTIFICATION_PROVIDER: unique symbol;
export declare const TELEGRAM_NOTIFICATION_PROVIDER: unique symbol;
export declare const IN_APP_NOTIFICATION_PROVIDER: unique symbol;
