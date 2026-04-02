import { NotificationStatus, NotificationType, UserRole } from '../../../common/enums';

export interface NotificationResult {
  id: string;
  userType: 'member' | 'staff';
  userId: string;
  userRole?: UserRole;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
