import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { PaymentType } from '../../../common/enums';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ collection: 'transactions', timestamps: true, versionKey: false })
export class Transaction {
  @Prop({ required: true, unique: true, trim: true })
  transactionReference!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff', index: true })
  staffId?: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'SavingsAccount', index: true })
  accountId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch', index: true })
  branchId!: Types.ObjectId;

  @Prop({ required: true, enum: PaymentType, index: true })
  type!: PaymentType;

  @Prop({ required: true, enum: ['mobile', 'branch'], index: true })
  channel!: 'mobile' | 'branch';

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ required: true, default: 'ETB' })
  currency!: string;

  @Prop({ trim: true })
  externalReference?: string;

  @Prop({ trim: true })
  narration?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ memberId: 1, createdAt: -1 });
TransactionSchema.index({ staffId: 1, createdAt: -1 });
TransactionSchema.index({ branchId: 1, type: 1, createdAt: -1 });
