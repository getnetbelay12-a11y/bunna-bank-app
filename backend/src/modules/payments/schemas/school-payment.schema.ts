import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SchoolPaymentDocument = HydratedDocument<SchoolPayment>;

@Schema({ collection: 'school_payments', timestamps: true, versionKey: false })
export class SchoolPayment {
  @Prop({ required: true, unique: true, type: Types.ObjectId, ref: 'Transaction' })
  transactionId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff', index: true })
  staffId?: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'SavingsAccount', index: true })
  accountId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch', index: true })
  branchId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  studentId!: string;

  @Prop({ required: true, trim: true, index: true })
  schoolName!: string;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ required: true, enum: ['mobile', 'branch'], index: true })
  channel!: 'mobile' | 'branch';

  @Prop({ required: true, enum: ['successful', 'failed'], index: true })
  status!: 'successful' | 'failed';
}

export const SchoolPaymentSchema = SchemaFactory.createForClass(SchoolPayment);

SchoolPaymentSchema.index({ memberId: 1, createdAt: -1 });
SchoolPaymentSchema.index({ branchId: 1, channel: 1, createdAt: -1 });
