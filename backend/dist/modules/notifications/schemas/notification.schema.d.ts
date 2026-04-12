import { HydratedDocument, Types } from 'mongoose';
import { NotificationChannel, NotificationStatus, NotificationType, UserRole } from '../../../common/enums';
export type NotificationDocument = HydratedDocument<Notification>;
export declare class Notification {
    userType: 'member' | 'staff';
    userId: Types.ObjectId;
    userRole?: UserRole;
    type: NotificationType;
    channel: NotificationChannel;
    status: NotificationStatus;
    title: string;
    message: string;
    entityType?: string;
    entityId?: Types.ObjectId;
    actionLabel?: string;
    priority?: string;
    deepLink?: string;
    dataPayload?: Record<string, unknown>;
    readAt?: Date;
    deliveredAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const NotificationSchema: import("mongoose").Schema<Notification, import("mongoose").Model<Notification, any, any, any, import("mongoose").Document<unknown, any, Notification, any, {}> & Notification & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Notification, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Notification>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Notification> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
