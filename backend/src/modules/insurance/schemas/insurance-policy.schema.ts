import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { InsurancePolicyStatus } from '../../../common/enums';

export type InsurancePolicyDocument = HydratedDocument<InsurancePolicy>;

@Schema({ collection: 'insurance_policies', timestamps: true, versionKey: false })
export class InsurancePolicy {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, unique: true, index: true })
  policyNumber!: string;

  @Prop({ required: true, trim: true })
  providerName!: string;

  @Prop({ required: true, trim: true })
  insuranceType!: string;

  @Prop({ type: Types.ObjectId, ref: 'Loan', index: true })
  linkedLoanId?: Types.ObjectId;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true, index: true })
  endDate!: Date;

  @Prop({ required: true, enum: InsurancePolicyStatus, index: true })
  status!: InsurancePolicyStatus;

  @Prop({ default: false, index: true })
  renewalReminderSent!: boolean;

  createdAt?: Date;

  updatedAt?: Date;
}

export const InsurancePolicySchema = SchemaFactory.createForClass(InsurancePolicy);

InsurancePolicySchema.index({ memberId: 1, status: 1, endDate: 1 });
InsurancePolicySchema.index({ linkedLoanId: 1, status: 1 });
