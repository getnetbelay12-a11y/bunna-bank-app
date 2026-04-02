import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

import {
  NotificationCampaignStatus,
  NotificationCategory,
  NotificationChannel,
  NotificationTemplateType,
} from '../../../common/enums';

export type NotificationCampaignDocument = HydratedDocument<NotificationCampaign>;

@Schema({ collection: 'notification_campaigns', timestamps: { createdAt: true, updatedAt: false }, versionKey: false })
export class NotificationCampaign {
  @Prop({ required: true, enum: NotificationCategory, index: true })
  category!: NotificationCategory;

  @Prop({ required: true, enum: NotificationTemplateType, index: true })
  templateType!: NotificationTemplateType;

  @Prop({ type: [String], enum: NotificationChannel, default: [] })
  channels!: NotificationChannel[];

  @Prop({ required: true, enum: ['single_customer', 'selected_customers', 'filtered_customers'] })
  targetType!: 'single_customer' | 'selected_customers' | 'filtered_customers';

  @Prop({ type: [Types.ObjectId], default: [] })
  targetIds!: Types.ObjectId[];

  @Prop({ type: SchemaTypes.Mixed })
  filters?: Record<string, unknown>;

  @Prop({ trim: true })
  messageSubject?: string;

  @Prop({ required: true, trim: true })
  messageBody!: string;

  @Prop({ required: true, enum: NotificationCampaignStatus, index: true })
  status!: NotificationCampaignStatus;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Staff', index: true })
  createdBy!: Types.ObjectId;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  sentAt?: Date;

  createdAt?: Date;
}

export const NotificationCampaignSchema =
  SchemaFactory.createForClass(NotificationCampaign);

NotificationCampaignSchema.index({ createdBy: 1, createdAt: -1 });
NotificationCampaignSchema.index({ status: 1, category: 1, createdAt: -1 });
