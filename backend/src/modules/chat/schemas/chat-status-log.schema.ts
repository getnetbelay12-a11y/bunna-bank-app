import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatStatusLogDocument = HydratedDocument<ChatStatusLog>;

@Schema({
  collection: 'chat_status_logs',
  timestamps: false,
  versionKey: false,
})
export class ChatStatusLog {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'ChatConversation',
    index: true,
  })
  conversationId!: Types.ObjectId;

  @Prop({
    enum: [
      'open',
      'assigned',
      'waiting_customer',
      'waiting_agent',
      'resolved',
      'closed',
    ],
  })
  fromStatus?:
    | 'open'
    | 'assigned'
    | 'waiting_customer'
    | 'waiting_agent'
    | 'resolved'
    | 'closed';

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
  toStatus!:
    | 'open'
    | 'assigned'
    | 'waiting_customer'
    | 'waiting_agent'
    | 'resolved'
    | 'closed';

  @Prop({ required: true, enum: ['customer', 'agent', 'system'] })
  changedByType!: 'customer' | 'agent' | 'system';

  @Prop({ trim: true })
  changedById?: string;

  @Prop({ trim: true })
  note?: string;

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date;
}

export const ChatStatusLogSchema =
  SchemaFactory.createForClass(ChatStatusLog);

ChatStatusLogSchema.index({ conversationId: 1, createdAt: -1 });
