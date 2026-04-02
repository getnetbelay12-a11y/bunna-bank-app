import { HydratedDocument, Types } from 'mongoose';
import { MemberType } from '../../../common/enums';
import { ChatIssueCategory } from '../dto';
export type ChatConversationDocument = HydratedDocument<ChatConversation>;
export declare class ChatConversation {
    memberId: Types.ObjectId;
    memberName: string;
    phoneNumber: string;
    memberType: MemberType;
    branchId?: Types.ObjectId;
    branchName?: string;
    districtId?: Types.ObjectId;
    districtName?: string;
    assignedToStaffId?: Types.ObjectId;
    assignedToStaffName?: string;
    status: 'open' | 'assigned' | 'waiting_customer' | 'waiting_agent' | 'resolved' | 'closed';
    channel: 'mobile';
    category: ChatIssueCategory;
    priority: 'low' | 'normal' | 'high';
    escalationFlag: boolean;
    lastMessageAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const ChatConversationSchema: import("mongoose").Schema<ChatConversation, import("mongoose").Model<ChatConversation, any, any, any, import("mongoose").Document<unknown, any, ChatConversation, any, {}> & ChatConversation & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChatConversation, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ChatConversation>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ChatConversation> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
