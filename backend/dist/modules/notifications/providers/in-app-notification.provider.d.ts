import { ChannelNotificationPayload, ChannelNotificationProvider, ChannelNotificationResult } from '../channel-notification-provider.port';
export declare class InAppNotificationProvider implements ChannelNotificationProvider {
    send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult>;
}
