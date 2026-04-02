import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema({
  collection: 'chat_messages',
  timestamps: true,
  versionKey: false,
})
export class ChatMessage {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'ChatConversation',
    index: true,
  })
  conversationId!: Types.ObjectId;

  @Prop({ required: true, enum: ['customer', 'agent', 'system'], index: true })
  senderType!: 'customer' | 'agent' | 'system';

  @Prop({ trim: true })
  senderId?: string;

  @Prop({ trim: true })
  senderName?: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ required: true, enum: ['text', 'system'], default: 'text' })
  messageType!: 'text' | 'system';

  @Prop()
  readAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });
