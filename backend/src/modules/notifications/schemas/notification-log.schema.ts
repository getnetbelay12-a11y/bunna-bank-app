import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import {
  NotificationCategory,
  NotificationChannel,
  NotificationLogStatus,
} from '../../../common/enums';

export type NotificationLogDocument = HydratedDocument<NotificationLog>;

@Schema({ collection: 'notification_logs', timestamps: { createdAt: true, updatedAt: false }, versionKey: false })
export class NotificationLog {
  @Prop({ required: true, type: Types.ObjectId, ref: 'NotificationCampaign', index: true })
  campaignId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, enum: NotificationCategory, index: true })
  category!: NotificationCategory;

  @Prop({ required: true, enum: NotificationChannel, index: true })
  channel!: NotificationChannel;

  @Prop({ required: true, trim: true })
  recipient!: string;

  @Prop({ required: true, enum: NotificationLogStatus, index: true })
  status!: NotificationLogStatus;

  @Prop({ trim: true })
  providerMessageId?: string;

  @Prop({ trim: true })
  messageSubject?: string;

  @Prop({ required: true, trim: true })
  messageBody!: string;

  @Prop({ trim: true })
  errorMessage?: string;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  createdAt?: Date;
}

export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLog);

NotificationLogSchema.index({ campaignId: 1, createdAt: -1 });
NotificationLogSchema.index({ memberId: 1, category: 1, createdAt: -1 });
