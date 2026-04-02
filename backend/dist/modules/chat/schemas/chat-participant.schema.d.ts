import { HydratedDocument, Types } from 'mongoose';
export type ChatParticipantDocument = HydratedDocument<ChatParticipant>;
export declare class ChatParticipant {
    conversationId: Types.ObjectId;
    participantType: 'customer' | 'agent' | 'system';
    participantId?: string;
    joinedAt: Date;
}
export declare const ChatParticipantSchema: import("mongoose").Schema<ChatParticipant, import("mongoose").Model<ChatParticipant, any, any, any, import("mongoose").Document<unknown, any, ChatParticipant, any, {}> & ChatParticipant & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChatParticipant, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ChatParticipant>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ChatParticipant> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
