import { ConfigService } from '@nestjs/config';
import { NotificationDispatchPayload, NotificationProviderPort } from './notification-provider.port';
export declare class NotificationProviderService implements NotificationProviderPort {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    dispatch(payload: NotificationDispatchPayload): Promise<boolean>;
    private dispatchPush;
    private dispatchSms;
    private dispatchEmail;
    private postToGenericEndpoint;
}
