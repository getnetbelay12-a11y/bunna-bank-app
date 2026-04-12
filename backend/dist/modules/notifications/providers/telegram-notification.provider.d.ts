import { ConfigService } from '@nestjs/config';
import { ChannelNotificationPayload, ChannelNotificationProvider, ChannelNotificationResult } from '../channel-notification-provider.port';
export declare class TelegramNotificationProvider implements ChannelNotificationProvider {
    private readonly configService;
    private readonly logger;
    private readonly enabled;
    private readonly botToken;
    private readonly apiBase;
    private readonly forceTestChatId;
    constructor(configService: ConfigService);
    send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult>;
    sendTextMessage(recipient: string, messageBody: string): Promise<ChannelNotificationResult>;
}
