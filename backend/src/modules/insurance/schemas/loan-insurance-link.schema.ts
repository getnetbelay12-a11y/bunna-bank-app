import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoanInsuranceLinkDocument = HydratedDocument<LoanInsuranceLink>;

@Schema({ collection: 'loan_insurance_links', timestamps: { createdAt: true, updatedAt: false }, versionKey: false })
export class LoanInsuranceLink {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Loan', index: true })
  loanId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'InsurancePolicy', index: true })
  insurancePolicyId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  relationType!: string;

  createdAt?: Date;
}

export const LoanInsuranceLinkSchema = SchemaFactory.createForClass(LoanInsuranceLink);

LoanInsuranceLinkSchema.index({ loanId: 1, insurancePolicyId: 1 }, { unique: true });
LoanInsuranceLinkSchema.index({ memberId: 1, createdAt: -1 });
