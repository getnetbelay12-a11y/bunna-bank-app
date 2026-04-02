import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatAssignmentDocument = HydratedDocument<ChatAssignment>;

@Schema({
  collection: 'chat_assignments',
  timestamps: false,
  versionKey: false,
})
export class ChatAssignment {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'ChatConversation',
    index: true,
  })
  conversationId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Staff', index: true })
  assignedToStaffId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  assignedBy?: Types.ObjectId;

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date;
}

export const ChatAssignmentSchema =
  SchemaFactory.createForClass(ChatAssignment);

ChatAssignmentSchema.index({ conversationId: 1, createdAt: -1 });
