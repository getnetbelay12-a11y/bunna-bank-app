import { Model } from 'mongoose';
import { CreateNotificationTemplateDto, UpdateNotificationTemplateDto } from './dto';
import { NotificationTemplate, NotificationTemplateDocument } from './schemas/notification-template.schema';
export declare class NotificationTemplateService {
    private readonly notificationTemplateModel;
    constructor(notificationTemplateModel: Model<NotificationTemplateDocument>);
    listTemplates(): Promise<((import("mongoose").Document<unknown, {}, NotificationTemplate, {}, {}> & NotificationTemplate & {
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
    createTemplate(dto: CreateNotificationTemplateDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, NotificationTemplate, {}, {}> & NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, NotificationTemplate, {}, {}> & NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    updateTemplate(templateId: string, dto: UpdateNotificationTemplateDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, NotificationTemplate, {}, {}> & NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, NotificationTemplate, {}, {}> & NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    getTemplateByType(templateType: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, NotificationTemplate, {}, {}> & NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, NotificationTemplate, {}, {}> & NotificationTemplate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | {
        _id: import("../../common/enums").NotificationTemplateType;
        category: import("../../common/enums").NotificationCategory;
        templateType: import("../../common/enums").NotificationTemplateType;
        title: string;
        subject: string;
        messageBody: string;
        channelDefaults: import("../../common/enums").NotificationChannel[];
        isActive: boolean;
    }>;
}
