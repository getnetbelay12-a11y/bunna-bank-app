import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import {
  NotificationCategory,
  NotificationChannel,
  NotificationTemplateType,
} from '../../../common/enums';

export type NotificationTemplateDocument = HydratedDocument<NotificationTemplate>;

@Schema({ collection: 'notification_templates', timestamps: true, versionKey: false })
export class NotificationTemplate {
  @Prop({ required: true, enum: NotificationCategory, index: true })
  category!: NotificationCategory;

  @Prop({ required: true, enum: NotificationTemplateType, unique: true, index: true })
  templateType!: NotificationTemplateType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  subject?: string;

  @Prop({ required: true, trim: true })
  messageBody!: string;

  @Prop({ type: [String], enum: NotificationChannel, default: [] })
  channelDefaults!: NotificationChannel[];

  @Prop({ default: true, index: true })
  isActive!: boolean;

  createdAt?: Date;

  updatedAt?: Date;
}

export const NotificationTemplateSchema =
  SchemaFactory.createForClass(NotificationTemplate);

NotificationTemplateSchema.index({ category: 1, isActive: 1 });
