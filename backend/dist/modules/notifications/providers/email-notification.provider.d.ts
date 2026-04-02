import { ChannelNotificationPayload, ChannelNotificationProvider, ChannelNotificationResult } from '../channel-notification-provider.port';
export declare class EmailNotificationProvider implements ChannelNotificationProvider {
    private readonly logger;
    private readonly logoCid;
    private readonly logoPath;
    private readonly provider;
    private readonly host;
    private readonly port;
    private readonly user;
    private readonly password;
    private readonly from;
    private readonly secure;
    send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult>;
    private buildAttachments;
    private escapeForHtml;
}
