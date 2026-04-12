import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { MemberDocument } from '../members/schemas/member.schema';
import { AutopaySettingDocument } from '../service-placeholders/schemas/autopay-setting.schema';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationTemplateService } from './notification-template.service';
import { TemplateRendererService } from './template-renderer.service';
import { CreateNotificationCampaignDto } from './dto';
import { NotificationCampaign, NotificationCampaignDocument } from './schemas/notification-campaign.schema';
import { NotificationLog, NotificationLogDocument } from './schemas/notification-log.schema';
import { NotificationsService } from './notifications.service';
type CampaignSendChannelSummary = {
    sent: number;
    delivered: number;
    failed: number;
    skipped: number;
};
type CampaignSendResult = NotificationCampaignDocument & {
    deliverySummary: {
        totalTargets: number;
        totalChannels: number;
        totalAttempts: number;
        channels: Record<string, CampaignSendChannelSummary>;
        perRecipientResults: Array<{
            customerId: string;
            memberId: string;
            channels: Record<string, {
                status: 'sent' | 'delivered' | 'failed' | 'skipped';
                recipient?: string;
                providerMessageId?: string;
                errorMessage?: string;
            }>;
        }>;
    };
};
export declare class NotificationCampaignService {
    private readonly notificationCampaignModel;
    private readonly notificationLogModel;
    private readonly memberModel;
    private readonly autopaySettingModel;
    private readonly configService;
    private readonly notificationTemplateService;
    private readonly notificationDeliveryService;
    private readonly templateRendererService;
    private readonly notificationsService;
    private readonly logger;
    private readonly testEmailRecipient;
    private readonly forceTestEmailRecipient;
    private readonly forceTestTelegramChatId;
    private readonly forceTestPushCustomerId;
    private readonly demoMode;
    private readonly nodeEnv;
    constructor(notificationCampaignModel: Model<NotificationCampaignDocument>, notificationLogModel: Model<NotificationLogDocument>, memberModel: Model<MemberDocument>, autopaySettingModel: Model<AutopaySettingDocument>, configService: ConfigService, notificationTemplateService: NotificationTemplateService, notificationDeliveryService: NotificationDeliveryService, templateRendererService: TemplateRendererService, notificationsService: NotificationsService);
    listCampaigns(currentUser: AuthenticatedUser): Promise<(import("mongoose").Document<unknown, {}, NotificationCampaign, {}, {}> & NotificationCampaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    createCampaign(currentUser: AuthenticatedUser, dto: CreateNotificationCampaignDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, NotificationCampaign, {}, {}> & NotificationCampaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, NotificationCampaign, {}, {}> & NotificationCampaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    getCampaign(currentUser: AuthenticatedUser, campaignId: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, NotificationCampaign, {}, {}> & NotificationCampaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, NotificationCampaign, {}, {}> & NotificationCampaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    sendCampaign(currentUser: AuthenticatedUser, campaignId: string): Promise<CampaignSendResult>;
    private resolveCampaignText;
    listLogs(currentUser: AuthenticatedUser, campaignId?: string): Promise<(import("mongoose").Document<unknown, {}, NotificationLog, {}, {}> & NotificationLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    private resolveTargets;
    private resolveRecipient;
    private renderCampaignContent;
    private buildCampaignFilters;
    private appendForcedDemoPushTarget;
    private normalizeChannels;
    private shouldStoreSpecificMobileRecord;
    private storeSpecificMobileNotification;
    private hasEnabledSchoolAutopay;
    private resolvePushMetadata;
    private resolveChannelBody;
    private buildCampaignScope;
    private buildMemberScope;
    private toObjectId;
    private ensureManagerAccess;
    private resolveForcedEmailRecipient;
    private isLocalDemoDeliveryMode;
    private resolveForcedTelegramChatId;
    private canReceiveTelegram;
    private createChannelSummary;
    private incrementChannelSummary;
    private recordRecipientResult;
    private buildTargetIdentifierFilter;
}
export {};
