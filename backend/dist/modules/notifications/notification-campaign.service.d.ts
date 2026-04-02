import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { MemberDocument } from '../members/schemas/member.schema';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationTemplateService } from './notification-template.service';
import { TemplateRendererService } from './template-renderer.service';
import { CreateNotificationCampaignDto } from './dto';
import { NotificationCampaign, NotificationCampaignDocument } from './schemas/notification-campaign.schema';
import { NotificationLog, NotificationLogDocument } from './schemas/notification-log.schema';
export declare class NotificationCampaignService {
    private readonly notificationCampaignModel;
    private readonly notificationLogModel;
    private readonly memberModel;
    private readonly notificationTemplateService;
    private readonly notificationDeliveryService;
    private readonly templateRendererService;
    private readonly logger;
    private readonly demoFallbackEmail;
    constructor(notificationCampaignModel: Model<NotificationCampaignDocument>, notificationLogModel: Model<NotificationLogDocument>, memberModel: Model<MemberDocument>, notificationTemplateService: NotificationTemplateService, notificationDeliveryService: NotificationDeliveryService, templateRendererService: TemplateRendererService);
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
    sendCampaign(currentUser: AuthenticatedUser, campaignId: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, NotificationCampaign, {}, {}> & NotificationCampaign & {
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
    listLogs(currentUser: AuthenticatedUser, campaignId?: string): Promise<(import("mongoose").Document<unknown, {}, NotificationLog, {}, {}> & NotificationLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    private resolveTargets;
    private resolveRecipient;
    private renderCampaignContent;
    private resolveChannelBody;
    private buildCampaignScope;
    private buildMemberScope;
    private ensureManagerAccess;
}
