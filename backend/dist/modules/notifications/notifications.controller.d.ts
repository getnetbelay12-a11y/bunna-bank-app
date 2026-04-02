import { AuthenticatedUser } from '../auth/interfaces';
import { CreateNotificationDto, ListNotificationsQueryDto } from './dto';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(currentUser: AuthenticatedUser): Promise<import("./interfaces").NotificationResult[]>;
    markAsRead(currentUser: AuthenticatedUser, notificationId: string): Promise<import("./interfaces").NotificationResult>;
    listNotifications(currentUser: AuthenticatedUser, query: ListNotificationsQueryDto): Promise<import("./interfaces").NotificationResult[]>;
    createNotification(dto: CreateNotificationDto): Promise<import("./interfaces").NotificationResult>;
}
