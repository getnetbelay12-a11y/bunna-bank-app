import { Model } from 'mongoose';
import { MemberDocument } from '../members/schemas/member.schema';
import { ChannelNotificationProvider } from './channel-notification-provider.port';
import { NotificationDispatchPayload, NotificationDispatchResult, NotificationProviderPort } from './notification-provider.port';
export declare class NotificationProviderService implements NotificationProviderPort {
    private readonly memberModel;
    private readonly mobilePushProvider;
    private readonly emailProvider;
    private readonly smsProvider;
    constructor(memberModel: Model<MemberDocument>, mobilePushProvider: ChannelNotificationProvider, emailProvider: ChannelNotificationProvider, smsProvider: ChannelNotificationProvider);
    dispatch(payload: NotificationDispatchPayload): Promise<NotificationDispatchResult>;
    private resolveCategory;
}
