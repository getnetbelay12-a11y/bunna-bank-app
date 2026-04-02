import { HydratedDocument, Types } from 'mongoose';
export type ChatMessageDocument = HydratedDocument<ChatMessage>;
export declare class ChatMessage {
    conversationId: Types.ObjectId;
    senderType: 'customer' | 'agent' | 'system';
    senderId?: string;
    senderName?: string;
    message: string;
    messageType: 'text' | 'system';
    readAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const ChatMessageSchema: import("mongoose").Schema<ChatMessage, import("mongoose").Model<ChatMessage, any, any, any, import("mongoose").Document<unknown, any, ChatMessage, any, {}> & ChatMessage & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChatMessage, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ChatMessage>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ChatMessage> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
