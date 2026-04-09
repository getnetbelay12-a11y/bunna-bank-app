import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeviceTokenDocument = HydratedDocument<DeviceToken>;

@Schema({ collection: 'device_tokens', timestamps: { createdAt: false, updatedAt: 'updatedAt' }, versionKey: false })
export class DeviceToken {
  @Prop({ required: true, type: Types.ObjectId, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  deviceId!: string;

  @Prop({ required: true, enum: ['android', 'ios'], index: true })
  platform!: 'android' | 'ios';

  @Prop({ required: true, trim: true, index: true })
  token!: string;

  @Prop({ trim: true })
  appVersion?: string;

  updatedAt?: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);

DeviceTokenSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
