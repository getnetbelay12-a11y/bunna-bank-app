import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { NotificationStatus, NotificationType, UserRole } from '../../../common/enums';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ collection: 'notifications', timestamps: true, versionKey: false })
export class Notification {
  @Prop({ required: true, enum: ['member', 'staff'], index: true })
  userType!: 'member' | 'staff';

  @Prop({ required: true, type: Types.ObjectId, index: true })
  userId!: Types.ObjectId;

  @Prop({ enum: UserRole, index: true })
  userRole?: UserRole;

  @Prop({ required: true, enum: NotificationType, index: true })
  type!: NotificationType;

  @Prop({
    required: true,
    enum: NotificationStatus,
    index: true,
  })
  status!: NotificationStatus;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ trim: true })
  entityType?: string;

  @Prop({ type: Types.ObjectId, index: true })
  entityId?: Types.ObjectId;

  @Prop()
  readAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
