import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { CardRequestStatus, CardRequestType } from '../card-management.types';

export type CardRequestDocument = HydratedDocument<CardRequest>;

@Schema({ collection: 'card_requests', timestamps: true, versionKey: false })
export class CardRequest {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Card', index: true })
  cardId?: Types.ObjectId;

  @Prop({ required: true, enum: CardRequestType, index: true })
  requestType!: CardRequestType;

  @Prop({
    required: true,
    enum: CardRequestStatus,
    default: CardRequestStatus.SUBMITTED,
    index: true,
  })
  status!: CardRequestStatus;

  @Prop({ trim: true })
  preferredBranch?: string;

  @Prop({ trim: true })
  reason?: string;

  createdAt?: Date;

  updatedAt?: Date;
}

export const CardRequestSchema = SchemaFactory.createForClass(CardRequest);
