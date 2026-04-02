import { Model } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { CreateNotificationDto, ListNotificationsQueryDto } from './dto';
import { NotificationResult } from './interfaces';
import { NotificationProviderPort } from './notification-provider.port';
import { NotificationDocument } from './schemas/notification.schema';
export declare class NotificationsService {
    private readonly notificationModel;
    private readonly notificationProvider;
    private readonly logger;
    constructor(notificationModel: Model<NotificationDocument>, notificationProvider: NotificationProviderPort);
    createNotification(dto: CreateNotificationDto): Promise<NotificationResult>;
    getMyNotifications(currentUser: AuthenticatedUser): Promise<NotificationResult[]>;
    listNotifications(query: ListNotificationsQueryDto, currentUser?: AuthenticatedUser): Promise<NotificationResult[]>;
    markAsRead(currentUser: AuthenticatedUser, notificationId: string): Promise<NotificationResult>;
    private resolveUserType;
    private isStaffRole;
    private toResult;
}
