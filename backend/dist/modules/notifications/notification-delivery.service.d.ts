import { NotificationLogStatus, UserRole } from '../../common/enums';
import { NotificationsService } from './notifications.service';
import { ChannelNotificationResult, type ChannelNotificationPayload, type ChannelNotificationProvider } from './channel-notification-provider.port';
export declare class NotificationDeliveryService {
    private readonly emailProvider;
    private readonly smsProvider;
    private readonly telegramProvider;
    private readonly inAppProvider;
    private readonly notificationsService;
    constructor(emailProvider: ChannelNotificationProvider, smsProvider: ChannelNotificationProvider, telegramProvider: ChannelNotificationProvider, inAppProvider: ChannelNotificationProvider, notificationsService: NotificationsService);
    deliver(payload: ChannelNotificationPayload & {
        userRole?: UserRole;
        createInAppRecord?: boolean;
    }): Promise<ChannelNotificationResult>;
    private resolveProvider;
    toLogStatus(result: ChannelNotificationResult): NotificationLogStatus;
}
