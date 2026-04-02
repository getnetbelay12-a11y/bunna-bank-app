import { HydratedDocument, Types } from 'mongoose';
import { NotificationCategory, NotificationChannel, NotificationLogStatus } from '../../../common/enums';
export type NotificationLogDocument = HydratedDocument<NotificationLog>;
export declare class NotificationLog {
    campaignId: Types.ObjectId;
    memberId: Types.ObjectId;
    category: NotificationCategory;
    channel: NotificationChannel;
    recipient: string;
    status: NotificationLogStatus;
    providerMessageId?: string;
    messageSubject?: string;
    messageBody: string;
    errorMessage?: string;
    sentAt?: Date;
    deliveredAt?: Date;
    createdAt?: Date;
}
export declare const NotificationLogSchema: import("mongoose").Schema<NotificationLog, import("mongoose").Model<NotificationLog, any, any, any, import("mongoose").Document<unknown, any, NotificationLog, any, {}> & NotificationLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, NotificationLog, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<NotificationLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<NotificationLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
