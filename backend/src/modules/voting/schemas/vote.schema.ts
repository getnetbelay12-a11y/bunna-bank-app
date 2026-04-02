import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { VoteStatus } from '../../../common/enums';

export type VoteDocument = HydratedDocument<Vote>;

@Schema({ collection: 'votes', timestamps: true, versionKey: false })
export class Vote {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, trim: true, index: true })
  type!: string;

  @Prop({ required: true, enum: VoteStatus, index: true })
  status!: VoteStatus;

  @Prop({ required: true, index: true })
  startDate!: Date;

  @Prop({ required: true, index: true })
  endDate!: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Staff', index: true })
  createdBy!: Types.ObjectId;

  @Prop()
  resultsPublishedAt?: Date;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);

VoteSchema.index({ status: 1, startDate: 1, endDate: 1 });
