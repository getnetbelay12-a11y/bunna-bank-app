import { ConfigService } from '@nestjs/config';
import { ChannelNotificationPayload, ChannelNotificationProvider, ChannelNotificationResult } from '../channel-notification-provider.port';
export declare class SmsNotificationProvider implements ChannelNotificationProvider {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult>;
}
