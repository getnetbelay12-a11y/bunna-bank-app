import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StaffPerformanceMonthlyDocument = HydratedDocument<StaffPerformanceMonthly>;

@Schema({
  collection: 'staff_performance_monthly',
  timestamps: true,
  versionKey: false,
})
export class StaffPerformanceMonthly {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Staff', index: true })
  staffId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch', index: true })
  branchId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'District', index: true })
  districtId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  periodStart!: Date;

  @Prop({ required: true, default: 0 })
  customersHelped!: number;

  @Prop({ required: true, default: 0 })
  membersServed!: number;

  @Prop({ required: true, default: 0 })
  transactionsCount!: number;

  @Prop({ required: true, default: 0 })
  loansHandled!: number;

  @Prop({ required: true, default: 0 })
  loanApplicationsCount!: number;

  @Prop({ required: true, default: 0 })
  loanApprovedCount!: number;

  @Prop({ required: true, default: 0 })
  loanRejectedCount!: number;

  @Prop({ required: true, default: 0 })
  loansEscalated!: number;

  @Prop({ required: true, default: 0 })
  kycCompleted!: number;

  @Prop({ required: true, default: 0 })
  supportResolved!: number;

  @Prop({ required: true, default: 0 })
  tasksCompleted!: number;

  @Prop({ required: true, default: 0 })
  avgHandlingTime!: number;

  @Prop({ required: true, default: 0 })
  responseTimeMinutes!: number;

  @Prop({ required: true, default: 0 })
  pendingTasks!: number;

  @Prop({ required: true, default: 0 })
  schoolPaymentsCount!: number;

  @Prop({ required: true, default: 0 })
  totalTransactionAmount!: number;

  @Prop({ required: true, default: 0 })
  score!: number;

  @Prop({
    required: true,
    enum: ['excellent', 'good', 'watch', 'needs_support'],
    default: 'good',
    index: true,
  })
  status!: 'excellent' | 'good' | 'watch' | 'needs_support';
}

export const StaffPerformanceMonthlySchema =
  SchemaFactory.createForClass(StaffPerformanceMonthly);

StaffPerformanceMonthlySchema.index({ staffId: 1, periodStart: 1 }, { unique: true });
