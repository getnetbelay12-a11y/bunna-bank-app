import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type IdentityVerificationDocument =
  HydratedDocument<IdentityVerification>;

@Schema({
  collection: 'identity_verifications',
  timestamps: true,
  versionKey: false,
})
export class IdentityVerification {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  phoneNumber!: string;

  @Prop({ trim: true, sparse: true, index: true })
  faydaFin?: string;

  @Prop({ trim: true })
  faydaAlias?: string;

  @Prop()
  qrDataRaw?: string;

  @Prop({ required: true, index: true })
  verificationMethod!: string;

  @Prop({ required: true, index: true })
  verificationStatus!: string;

  @Prop()
  verifiedAt?: Date;

  @Prop({ trim: true })
  verificationReference?: string;

  @Prop({ trim: true })
  failureReason?: string;

  createdAt?: Date;

  updatedAt?: Date;
}

export const IdentityVerificationSchema =
  SchemaFactory.createForClass(IdentityVerification);

IdentityVerificationSchema.index({ memberId: 1, createdAt: -1 });
IdentityVerificationSchema.index({ phoneNumber: 1, verificationStatus: 1 });
