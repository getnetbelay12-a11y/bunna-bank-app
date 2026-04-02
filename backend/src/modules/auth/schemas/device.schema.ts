import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

@Schema({ collection: 'devices', timestamps: true, versionKey: false })
export class Device {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  deviceId!: string;

  @Prop({ default: false })
  rememberDevice!: boolean;

  @Prop({ default: false })
  biometricEnabled!: boolean;

  @Prop()
  lastLoginAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index({ memberId: 1, deviceId: 1 }, { unique: true });
