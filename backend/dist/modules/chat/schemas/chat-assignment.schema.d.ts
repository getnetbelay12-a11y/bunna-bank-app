import { HydratedDocument, Types } from 'mongoose';
export type ChatAssignmentDocument = HydratedDocument<ChatAssignment>;
export declare class ChatAssignment {
    conversationId: Types.ObjectId;
    assignedToStaffId: Types.ObjectId;
    assignedBy?: Types.ObjectId;
    createdAt: Date;
}
export declare const ChatAssignmentSchema: import("mongoose").Schema<ChatAssignment, import("mongoose").Model<ChatAssignment, any, any, any, import("mongoose").Document<unknown, any, ChatAssignment, any, {}> & ChatAssignment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChatAssignment, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ChatAssignment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ChatAssignment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
