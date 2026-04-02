import { HydratedDocument } from 'mongoose';
import { NotificationCategory, NotificationChannel, NotificationTemplateType } from '../../../common/enums';
export type NotificationTemplateDocument = HydratedDocument<NotificationTemplate>;
export declare class NotificationTemplate {
    category: NotificationCategory;
    templateType: NotificationTemplateType;
    title: string;
    subject?: string;
    messageBody: string;
    channelDefaults: NotificationChannel[];
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const NotificationTemplateSchema: import("mongoose").Schema<NotificationTemplate, import("mongoose").Model<NotificationTemplate, any, any, any, import("mongoose").Document<unknown, any, NotificationTemplate, any, {}> & NotificationTemplate & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, NotificationTemplate, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<NotificationTemplate>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<NotificationTemplate> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
