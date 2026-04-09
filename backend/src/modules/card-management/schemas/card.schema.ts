import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { CardStatus } from '../card-management.types';

export type CardDocument = HydratedDocument<Card>;

@Schema({ collection: 'cards', timestamps: true, versionKey: false })
export class Card {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  cardType!: string;

  @Prop({ trim: true })
  last4?: string;

  @Prop({
    type: Object,
    default: { atm: true, pos: true, ecommerce: false },
  })
  channelControls!: {
    atm: boolean;
    pos: boolean;
    ecommerce: boolean;
  };

  @Prop({
    required: true,
    enum: CardStatus,
    default: CardStatus.PENDING_ISSUE,
    index: true,
  })
  status!: CardStatus;

  @Prop({ trim: true })
  preferredBranch?: string;

  @Prop()
  issuedAt?: Date;

  @Prop()
  lockedAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const CardSchema = SchemaFactory.createForClass(Card);
