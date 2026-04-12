import { NotificationChannel, NotificationStatus, NotificationType, UserRole } from '../../../common/enums';
export declare class CreateNotificationDto {
    userType: 'member' | 'staff';
    userId: string;
    userRole?: UserRole;
    type: NotificationType;
    channel?: NotificationChannel;
    status?: NotificationStatus;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    actionLabel?: string;
    priority?: string;
    deepLink?: string;
    dataPayload?: Record<string, unknown>;
}
