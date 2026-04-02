import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SavingsAccountDocument = HydratedDocument<SavingsAccount>;

@Schema({ collection: 'savings_accounts', timestamps: true, versionKey: false })
export class SavingsAccount {
  @Prop({ required: true, unique: true, trim: true })
  accountNumber!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch', index: true })
  branchId!: Types.ObjectId;

  @Prop({ required: true, min: 0, default: 0 })
  balance!: number;

  @Prop({ required: true, default: 'ETB' })
  currency!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const SavingsAccountSchema = SchemaFactory.createForClass(SavingsAccount);

SavingsAccountSchema.index({ memberId: 1, isActive: 1 });
