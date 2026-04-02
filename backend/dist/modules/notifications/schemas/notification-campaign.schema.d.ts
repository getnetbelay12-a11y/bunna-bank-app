import { HydratedDocument, Types } from 'mongoose';
import { NotificationCampaignStatus, NotificationCategory, NotificationChannel, NotificationTemplateType } from '../../../common/enums';
export type NotificationCampaignDocument = HydratedDocument<NotificationCampaign>;
export declare class NotificationCampaign {
    category: NotificationCategory;
    templateType: NotificationTemplateType;
    channels: NotificationChannel[];
    targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
    targetIds: Types.ObjectId[];
    filters?: Record<string, unknown>;
    messageSubject?: string;
    messageBody: string;
    status: NotificationCampaignStatus;
    createdBy: Types.ObjectId;
    scheduledAt?: Date;
    sentAt?: Date;
    createdAt?: Date;
}
export declare const NotificationCampaignSchema: import("mongoose").Schema<NotificationCampaign, import("mongoose").Model<NotificationCampaign, any, any, any, import("mongoose").Document<unknown, any, NotificationCampaign, any, {}> & NotificationCampaign & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, NotificationCampaign, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<NotificationCampaign>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<NotificationCampaign> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
