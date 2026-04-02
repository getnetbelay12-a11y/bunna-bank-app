import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SelfieVerificationDocument = HydratedDocument<SelfieVerification>;

@Schema({
  collection: 'selfie_verifications',
  timestamps: true,
  versionKey: false,
})
export class SelfieVerification {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  imageReference!: string;

  @Prop({ required: true, trim: true, index: true })
  purpose!: string;

  @Prop({ default: 'manual_review_required', index: true })
  status!: string;
}

export const SelfieVerificationSchema =
  SchemaFactory.createForClass(SelfieVerification);
