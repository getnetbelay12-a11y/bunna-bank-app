import { NotificationStatus, NotificationType } from '../../../common/enums';
export declare class ListNotificationsQueryDto {
    userId?: string;
    userType?: 'member' | 'staff';
    type?: NotificationType;
    status?: NotificationStatus;
}
