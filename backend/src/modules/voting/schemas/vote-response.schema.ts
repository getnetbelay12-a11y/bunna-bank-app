import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VoteResponseDocument = HydratedDocument<VoteResponse>;

@Schema({ collection: 'vote_responses', timestamps: true, versionKey: false })
export class VoteResponse {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Vote', index: true })
  voteId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'VoteOption', index: true })
  optionId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch', index: true })
  branchId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'District', index: true })
  districtId!: Types.ObjectId;

  @Prop({ required: true })
  encryptedBallot!: string;

  @Prop()
  otpVerifiedAt?: Date;
}

export const VoteResponseSchema = SchemaFactory.createForClass(VoteResponse);

VoteResponseSchema.index({ voteId: 1, memberId: 1 }, { unique: true });
VoteResponseSchema.index({ voteId: 1, optionId: 1 });
