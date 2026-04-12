import { ChannelNotificationPayload, ChannelNotificationProvider, ChannelNotificationResult } from '../channel-notification-provider.port';
export declare class SmsNotificationProvider implements ChannelNotificationProvider {
    private readonly logger;
    send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult>;
}
