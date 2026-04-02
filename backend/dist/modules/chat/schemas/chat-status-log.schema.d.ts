import { HydratedDocument, Types } from 'mongoose';
export type ChatStatusLogDocument = HydratedDocument<ChatStatusLog>;
export declare class ChatStatusLog {
    conversationId: Types.ObjectId;
    fromStatus?: 'open' | 'assigned' | 'waiting_customer' | 'waiting_agent' | 'resolved' | 'closed';
    toStatus: 'open' | 'assigned' | 'waiting_customer' | 'waiting_agent' | 'resolved' | 'closed';
    changedByType: 'customer' | 'agent' | 'system';
    changedById?: string;
    note?: string;
    createdAt: Date;
}
export declare const ChatStatusLogSchema: import("mongoose").Schema<ChatStatusLog, import("mongoose").Model<ChatStatusLog, any, any, any, import("mongoose").Document<unknown, any, ChatStatusLog, any, {}> & ChatStatusLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChatStatusLog, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ChatStatusLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ChatStatusLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
