import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BranchPerformanceDailyDocument = HydratedDocument<BranchPerformanceDaily>;

@Schema({
  collection: 'branch_performance_daily',
  timestamps: true,
  versionKey: false,
})
export class BranchPerformanceDaily {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch', index: true })
  branchId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  branchName!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'District', index: true })
  districtId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  districtName!: string;

  @Prop({ required: true, index: true })
  date!: Date;

  @Prop({ required: true, default: 0 })
  membersServed!: number;

  @Prop({ required: true, default: 0 })
  customersHelped!: number;

  @Prop({ required: true, default: 0 })
  loansHandled!: number;

  @Prop({ required: true, default: 0 })
  loansApproved!: number;

  @Prop({ required: true, default: 0 })
  loansEscalated!: number;

  @Prop({ required: true, default: 0 })
  kycCompleted!: number;

  @Prop({ required: true, default: 0 })
  supportResolved!: number;

  @Prop({ required: true, default: 0 })
  transactionsProcessed!: number;

  @Prop({ required: true, default: 0 })
  avgHandlingTime!: number;

  @Prop({ required: true, default: 0 })
  pendingTasks!: number;

  @Prop({ required: true, default: 0 })
  pendingApprovals!: number;

  @Prop({ required: true, default: 0 })
  responseTimeMinutes!: number;

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

export const BranchPerformanceDailySchema =
  SchemaFactory.createForClass(BranchPerformanceDaily);

BranchPerformanceDailySchema.index({ branchId: 1, date: 1 }, { unique: true });
BranchPerformanceDailySchema.index({ districtId: 1, date: 1 });
