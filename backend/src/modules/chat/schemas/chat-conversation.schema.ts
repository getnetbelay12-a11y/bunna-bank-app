import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { MemberType } from '../../../common/enums';
import { Loan } from '../../loans/schemas/loan.schema';
import { ChatIssueCategory } from '../dto';

export type ChatConversationDocument = HydratedDocument<ChatConversation>;

@Schema({
  collection: 'chat_conversations',
  timestamps: true,
  versionKey: false,
})
export class ChatConversation {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  memberName!: string;

  @Prop({ required: true, trim: true })
  phoneNumber!: string;

  @Prop({ required: true, enum: MemberType, index: true })
  memberType!: MemberType;

  @Prop({ type: Types.ObjectId, ref: 'Branch', index: true })
  branchId?: Types.ObjectId;

  @Prop({ trim: true })
  branchName?: string;

  @Prop({ type: Types.ObjectId, ref: 'District', index: true })
  districtId?: Types.ObjectId;

  @Prop({ trim: true })
  districtName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Staff', index: true })
  assignedToStaffId?: Types.ObjectId;

  @Prop({ trim: true })
  assignedToStaffName?: string;

  @Prop({ type: Types.ObjectId, ref: Loan.name, index: true })
  loanId?: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['general', 'branch', 'district', 'head_office'],
    default: 'general',
    index: true,
  })
  routingLevel!: 'general' | 'branch' | 'district' | 'head_office';

  @Prop({
    required: true,
    enum: [
      'open',
      'assigned',
      'waiting_customer',
      'waiting_agent',
      'resolved',
      'closed',
    ],
    index: true,
  })
  status!:
    | 'open'
    | 'assigned'
    | 'waiting_customer'
    | 'waiting_agent'
    | 'resolved'
    | 'closed';

  @Prop({ required: true, enum: ['mobile'], default: 'mobile' })
  channel!: 'mobile';

  @Prop({ required: true, enum: ChatIssueCategory, index: true })
  category!: ChatIssueCategory;

  @Prop({ required: true, enum: ['low', 'normal', 'high'], default: 'normal' })
  priority!: 'low' | 'normal' | 'high';

  @Prop({ default: false, index: true })
  escalationFlag!: boolean;

  @Prop({ index: true })
  lastMessageAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const ChatConversationSchema =
  SchemaFactory.createForClass(ChatConversation);

ChatConversationSchema.index({ memberId: 1, updatedAt: -1 });
ChatConversationSchema.index({
  status: 1,
  assignedToStaffId: 1,
  lastMessageAt: -1,
});
ChatConversationSchema.index({
  memberId: 1,
  loanId: 1,
  routingLevel: 1,
  status: 1,
});
