import { ConfigService } from '@nestjs/config';
import { ChannelNotificationPayload, ChannelNotificationProvider, ChannelNotificationResult } from '../channel-notification-provider.port';
export declare class EmailNotificationProvider implements ChannelNotificationProvider {
    private readonly configService;
    private readonly logger;
    private transport;
    constructor(configService: ConfigService);
    send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult>;
    private getTransport;
    private escapeForHtml;
    private buildDeliveryErrorMessage;
}
