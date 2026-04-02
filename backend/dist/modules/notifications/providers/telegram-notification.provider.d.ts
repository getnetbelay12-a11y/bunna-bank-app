import { ChannelNotificationPayload, ChannelNotificationProvider, ChannelNotificationResult } from '../channel-notification-provider.port';
export declare class TelegramNotificationProvider implements ChannelNotificationProvider {
    private readonly logger;
    send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult>;
}
