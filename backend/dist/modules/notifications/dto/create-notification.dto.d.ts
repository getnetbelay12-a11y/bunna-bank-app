import { NotificationStatus, NotificationType, UserRole } from '../../../common/enums';
export declare class CreateNotificationDto {
    userType: 'member' | 'staff';
    userId: string;
    userRole?: UserRole;
    type: NotificationType;
    status?: NotificationStatus;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
}
