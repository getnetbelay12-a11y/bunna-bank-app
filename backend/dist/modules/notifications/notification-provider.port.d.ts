import { NotificationCategory, NotificationChannel, NotificationStatus, NotificationType } from '../../common/enums';
export interface NotificationDispatchPayload {
    userType: 'member' | 'staff';
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: string;
    actionLabel?: string;
    deepLink?: string;
    dataPayload?: Record<string, unknown>;
    preferredChannel?: NotificationChannel;
}
export interface NotificationDispatchResult {
    channel: NotificationChannel;
    status: NotificationStatus;
    deliveredAt?: Date;
    errorMessage?: string;
    fallbackChannel?: NotificationChannel;
    category: NotificationCategory;
}
export interface NotificationProviderPort {
    dispatch(payload: NotificationDispatchPayload): Promise<NotificationDispatchResult>;
}
export declare const NOTIFICATION_PROVIDER_PORT: unique symbol;
