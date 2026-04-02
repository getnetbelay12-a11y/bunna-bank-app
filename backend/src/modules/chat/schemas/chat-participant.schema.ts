import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatParticipantDocument = HydratedDocument<ChatParticipant>;

@Schema({
  collection: 'chat_participants',
  timestamps: false,
  versionKey: false,
})
export class ChatParticipant {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'ChatConversation',
    index: true,
  })
  conversationId!: Types.ObjectId;

  @Prop({ required: true, enum: ['customer', 'agent', 'system'], index: true })
  participantType!: 'customer' | 'agent' | 'system';

  @Prop({ trim: true, index: true })
  participantId?: string;

  @Prop({ required: true, default: () => new Date() })
  joinedAt!: Date;
}

export const ChatParticipantSchema =
  SchemaFactory.createForClass(ChatParticipant);

ChatParticipantSchema.index(
  { conversationId: 1, participantType: 1, participantId: 1 },
  { unique: true },
);
