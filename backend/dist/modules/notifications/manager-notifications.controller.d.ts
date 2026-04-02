import { AuthenticatedUser } from '../auth/interfaces';
import { CreateNotificationCampaignDto, CreateNotificationTemplateDto, UpdateNotificationTemplateDto } from './dto';
import { NotificationCampaignService } from './notification-campaign.service';
import { NotificationTemplateService } from './notification-template.service';
export declare class ManagerNotificationsController {
    private readonly notificationTemplateService;
    private readonly notificationCampaignService;
    constructor(notificationTemplateService: NotificationTemplateService, notificationCampaignService: NotificationCampaignService);
    listTemplates(): Promise<((import("mongoose").Document<unknown, {}, import("./schemas/notification-template.schema").NotificationTemplate, {}, {}> & import("./schemas/notification-template.schema").NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }) | {
        _id: import("../../common/enums").NotificationTemplateType;
        category: import("../../common/enums").NotificationCategory;
        templateType: import("../../common/enums").NotificationTemplateType;
        title: string;
        subject: string;
        messageBody: string;
        channelDefaults: import("../../common/enums").NotificationChannel[];
        isActive: boolean;
    })[]>;
    createTemplate(dto: CreateNotificationTemplateDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/notification-template.schema").NotificationTemplate, {}, {}> & import("./schemas/notification-template.schema").NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./schemas/notification-template.schema").NotificationTemplate, {}, {}> & import("./schemas/notification-template.schema").NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateTemplate(templateId: string, dto: UpdateNotificationTemplateDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/notification-template.schema").NotificationTemplate, {}, {}> & import("./schemas/notification-template.schema").NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./schemas/notification-template.schema").NotificationTemplate, {}, {}> & import("./schemas/notification-template.schema").NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    listCampaigns(currentUser: AuthenticatedUser): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/notification-campaign.schema").NotificationCampaign, {}, {}> & import("./schemas/notification-campaign.schema").NotificationCampaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    createCampaign(currentUser: AuthenticatedUser, dto: CreateNotificationCampaignDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/notification-campaign.schema").NotificationCampaign, {}, {}> & import("./schemas/notification-campaign.schema").NotificationCampaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./schemas/notification-campaign.schema").NotificationCampaign, {}, {}> & import("./schemas/notification-campaign.schema").NotificationCampaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    getCampaign(currentUser: AuthenticatedUser, campaignId: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/notification-campaign.schema").NotificationCampaign, {}, {}> & import("./schemas/notification-campaign.schema").NotificationCampaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./schemas/notification-campaign.schema").NotificationCampaign, {}, {}> & import("./schemas/notification-campaign.schema").NotificationCampaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    sendCampaign(currentUser: AuthenticatedUser, campaignId: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/notification-campaign.schema").NotificationCampaign, {}, {}> & import("./schemas/notification-campaign.schema").NotificationCampaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./schemas/notification-campaign.schema").NotificationCampaign, {}, {}> & import("./schemas/notification-campaign.schema").NotificationCampaign & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    listLogs(currentUser: AuthenticatedUser): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/notification-log.schema").NotificationLog, {}, {}> & import("./schemas/notification-log.schema").NotificationLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    listLogsByCampaign(currentUser: AuthenticatedUser, campaignId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/notification-log.schema").NotificationLog, {}, {}> & import("./schemas/notification-log.schema").NotificationLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
}
