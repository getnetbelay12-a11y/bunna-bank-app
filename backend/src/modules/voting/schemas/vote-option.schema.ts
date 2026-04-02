import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VoteOptionDocument = HydratedDocument<VoteOption>;

@Schema({ collection: 'vote_options', timestamps: true, versionKey: false })
export class VoteOption {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Vote', index: true })
  voteId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, default: 1 })
  displayOrder!: number;
}

export const VoteOptionSchema = SchemaFactory.createForClass(VoteOption);

VoteOptionSchema.index({ voteId: 1, displayOrder: 1 });
