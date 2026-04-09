import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { MemberType, UserRole } from '../../../common/enums';

export type MemberDocument = HydratedDocument<Member>;

@Schema({ collection: 'members', timestamps: true, versionKey: false })
export class Member {
  @Prop({ required: true, unique: true, trim: true, index: true })
  customerId!: string;

  @Prop({ required: true, unique: true, trim: true })
  memberNumber!: string;

  @Prop({ required: true, enum: MemberType, index: true })
  memberType!: MemberType;

  @Prop({ default: false, index: true })
  isShareholder!: boolean;

  @Prop({ default: 0, min: 0 })
  shares!: number;

  @Prop({ trim: true, unique: true, sparse: true })
  shareholderId?: string;

  @Prop({
    required: true,
    enum: [UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER],
    index: true,
  })
  role!: UserRole;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, unique: true, trim: true })
  phone!: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  telegramChatId?: string;

  @Prop({ trim: true })
  telegramUserId?: string;

  @Prop({ trim: true })
  telegramUsername?: string;

  @Prop({ trim: true })
  telegramFirstName?: string;

  @Prop({ trim: true })
  telegramLastName?: string;

  @Prop({ default: false, index: true })
  telegramSubscribed!: boolean;

  @Prop()
  telegramLinkedAt?: Date;

  @Prop()
  telegramLastMessageAt?: Date;

  @Prop({ default: true })
  optInLoanReminders!: boolean;

  @Prop({ default: true })
  optInInsuranceReminders!: boolean;

  @Prop({ trim: true, index: true })
  region?: string;

  @Prop({ trim: true, index: true })
  city?: string;

  @Prop({ trim: true })
  preferredBranchName?: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch', index: true })
  branchId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'District', index: true })
  districtId!: Types.ObjectId;

  @Prop({ default: 0, min: 0 })
  shareBalance!: number;

  @Prop({ trim: true, unique: true, sparse: true })
  faydaFin?: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop()
  pinHash?: string;

  @Prop({ default: 'not_started', index: true })
  kycStatus!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

MemberSchema.index({ branchId: 1, memberType: 1 });
MemberSchema.index({ districtId: 1, memberType: 1 });
