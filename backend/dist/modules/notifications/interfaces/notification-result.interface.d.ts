import { NotificationChannel, NotificationStatus, NotificationType, UserRole } from '../../../common/enums';
export interface NotificationResult {
    id: string;
    userType: 'member' | 'staff';
    userId: string;
    userRole?: UserRole;
    type: NotificationType;
    channel: NotificationChannel;
    status: NotificationStatus;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    actionLabel?: string;
    priority?: string;
    deepLink?: string;
    dataPayload?: Record<string, unknown>;
    readAt?: Date;
    deliveredAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
