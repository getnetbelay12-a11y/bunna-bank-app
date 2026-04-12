import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StaffStepUpTokenDocument = HydratedDocument<StaffStepUpToken>;

@Schema({ collection: 'staff_step_up_tokens', timestamps: true, versionKey: false })
export class StaffStepUpToken {
  @Prop({ required: true, trim: true, unique: true, index: true })
  tokenId!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Staff', index: true })
  staffId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  purpose!: string;

  @Prop({ required: true, trim: true })
  method!: string;

  @Prop({ required: true })
  boundDecisionVersion!: number;

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  @Prop({ index: true })
  consumedAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const StaffStepUpTokenSchema = SchemaFactory.createForClass(StaffStepUpToken);

StaffStepUpTokenSchema.index({ staffId: 1, purpose: 1, createdAt: -1 });
