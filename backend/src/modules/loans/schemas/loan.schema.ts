import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { LoanStatus, LoanWorkflowLevel } from '../../../common/enums';

export type LoanDocument = HydratedDocument<Loan>;

@Schema({ collection: 'loans', timestamps: true, versionKey: false })
export class Loan {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch', index: true })
  branchId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'District', index: true })
  districtId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  loanType!: string;

  @Prop({ required: true, min: 0, index: true })
  amount!: number;

  @Prop({ required: true, min: 0 })
  interestRate!: number;

  @Prop({ required: true, min: 1 })
  termMonths!: number;

  @Prop({ required: true, trim: true })
  purpose!: string;

  @Prop({ required: true, enum: LoanStatus, index: true })
  status!: LoanStatus;

  @Prop({ required: true, enum: LoanWorkflowLevel, index: true })
  currentLevel!: LoanWorkflowLevel;

  @Prop({ type: Types.ObjectId, ref: 'Staff', index: true })
  assignedToStaffId?: Types.ObjectId;

  createdAt?: Date;

  updatedAt?: Date;
}

export const LoanSchema = SchemaFactory.createForClass(Loan);

LoanSchema.index({ memberId: 1, createdAt: -1 });
LoanSchema.index({ branchId: 1, status: 1, currentLevel: 1, createdAt: -1 });
LoanSchema.index({ districtId: 1, status: 1, currentLevel: 1, createdAt: -1 });
LoanSchema.index({ status: 1, currentLevel: 1, branchId: 1 });
LoanSchema.index({ status: 1, currentLevel: 1, districtId: 1 });
