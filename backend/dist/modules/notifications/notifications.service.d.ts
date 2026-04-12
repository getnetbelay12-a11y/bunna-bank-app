import { Model } from 'mongoose';
import { UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { CreateNotificationDto, ListNotificationsQueryDto } from './dto';
import { NotificationResult } from './interfaces';
import { NotificationProviderPort } from './notification-provider.port';
import { NotificationDocument } from './schemas/notification.schema';
export declare class NotificationsService {
    private readonly notificationModel;
    private readonly notificationProvider;
    private readonly logger;
    private static readonly SECURITY_BREACH_DIGEST_WINDOW_MS;
    private static readonly SECURITY_STALL_DIGEST_WINDOW_MS;
    constructor(notificationModel: Model<NotificationDocument>, notificationProvider: NotificationProviderPort);
    createNotification(dto: CreateNotificationDto): Promise<NotificationResult>;
    notifyStaffSecurityBreachDigest(input: {
        userId: string;
        userRole: UserRole;
        serviceRequestId: string;
    }): Promise<NotificationResult>;
    notifyStaffSecurityInvestigationStalledDigest(input: {
        userId: string;
        userRole: UserRole;
        serviceRequestId: string;
    }): Promise<NotificationResult>;
    storeNotificationRecord(dto: CreateNotificationDto & {
        deliveredAt?: Date;
    }): Promise<NotificationResult>;
    getMyNotifications(currentUser: AuthenticatedUser): Promise<NotificationResult[]>;
    listNotifications(query: ListNotificationsQueryDto, currentUser?: AuthenticatedUser): Promise<NotificationResult[]>;
    markAsRead(currentUser: AuthenticatedUser, notificationId: string): Promise<NotificationResult>;
    private resolveUserType;
    private isStaffRole;
    private toResult;
}
