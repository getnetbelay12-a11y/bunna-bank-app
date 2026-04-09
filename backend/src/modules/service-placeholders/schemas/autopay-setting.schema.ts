import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AutopaySettingDocument = HydratedDocument<AutopaySetting>;

@Schema({ collection: 'autopay_settings', timestamps: true, versionKey: false })
export class AutopaySetting {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  serviceType!: string;

  @Prop({ required: true, trim: true })
  accountId!: string;

  @Prop({ required: true, trim: true })
  schedule!: string;

  @Prop({ default: true, index: true })
  enabled!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AutopaySettingSchema = SchemaFactory.createForClass(AutopaySetting);

AutopaySettingSchema.index({ memberId: 1, serviceType: 1 }, { unique: true });
