import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import {
  LoanAction,
  LoanStatus,
  LoanWorkflowLevel,
  UserRole,
} from '../../../common/enums';

export type LoanWorkflowHistoryDocument = HydratedDocument<LoanWorkflowHistory>;

@Schema({
  collection: 'loan_workflow_history',
  timestamps: true,
  versionKey: false,
})
export class LoanWorkflowHistory {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Loan', index: true })
  loanId!: Types.ObjectId;

  @Prop({ required: true, enum: LoanAction, index: true })
  action!: LoanAction;

  @Prop({ required: true, enum: LoanWorkflowLevel, index: true })
  level!: LoanWorkflowLevel;

  @Prop({ required: true, enum: LoanStatus, index: true })
  fromStatus!: LoanStatus;

  @Prop({ required: true, enum: LoanStatus, index: true })
  toStatus!: LoanStatus;

  @Prop({ type: Types.ObjectId, index: true })
  actorId?: Types.ObjectId;

  @Prop({ enum: UserRole })
  actorRole?: UserRole;

  @Prop({ trim: true })
  comment?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LoanWorkflowHistorySchema =
  SchemaFactory.createForClass(LoanWorkflowHistory);

LoanWorkflowHistorySchema.index({ loanId: 1, createdAt: 1 });
