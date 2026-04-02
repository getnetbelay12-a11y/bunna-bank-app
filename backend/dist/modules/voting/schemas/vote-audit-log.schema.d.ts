import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { UserRole } from '../../../common/enums';
export type VoteAuditLogDocument = HydratedDocument<VoteAuditLog>;
export declare class VoteAuditLog {
    voteId: Types.ObjectId;
    memberId: Types.ObjectId;
    action: string;
    actorId?: Types.ObjectId;
    actorRole?: UserRole;
    metadata?: Record<string, unknown>;
}
export declare const VoteAuditLogSchema: MongooseSchema<VoteAuditLog, import("mongoose").Model<VoteAuditLog, any, any, any, import("mongoose").Document<unknown, any, VoteAuditLog, any, {}> & VoteAuditLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VoteAuditLog, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<VoteAuditLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<VoteAuditLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
