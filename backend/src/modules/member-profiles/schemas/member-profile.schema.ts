import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MemberProfileDocument = HydratedDocument<MemberProfileEntity>;

@Schema({
  collection: 'member_profiles',
  timestamps: true,
  versionKey: false,
})
export class MemberProfileEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', unique: true, index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true })
  dateOfBirth!: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch', index: true })
  branchId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'District', index: true })
  districtId!: Types.ObjectId;

  @Prop({ default: 'pending_verification', index: true })
  membershipStatus!: string;

  @Prop({ default: 'not_started', index: true })
  identityVerificationStatus!: string;

  @Prop({ default: true })
  consentAccepted!: boolean;

  createdAt?: Date;

  updatedAt?: Date;
}

export const MemberProfileSchema = SchemaFactory.createForClass(MemberProfileEntity);

MemberProfileSchema.index({ branchId: 1, membershipStatus: 1 });
