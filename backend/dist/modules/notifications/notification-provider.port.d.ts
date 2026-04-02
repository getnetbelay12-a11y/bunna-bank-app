import { NotificationType } from '../../common/enums';
export interface NotificationDispatchPayload {
    userType: 'member' | 'staff';
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
}
export interface NotificationProviderPort {
    dispatch(payload: NotificationDispatchPayload): Promise<boolean>;
}
export declare const NOTIFICATION_PROVIDER_PORT: unique symbol;
