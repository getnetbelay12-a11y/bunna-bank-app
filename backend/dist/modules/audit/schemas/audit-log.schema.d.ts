import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { UserRole } from '../../../common/enums';
export type AuditLogDocument = HydratedDocument<AuditLog>;
export declare class AuditLog {
    actorId: Types.ObjectId;
    actorRole: UserRole;
    actionType: string;
    entityType: string;
    entityId: Types.ObjectId;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const AuditLogSchema: MongooseSchema<AuditLog, import("mongoose").Model<AuditLog, any, any, any, import("mongoose").Document<unknown, any, AuditLog, any, {}> & AuditLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AuditLog, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AuditLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AuditLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
