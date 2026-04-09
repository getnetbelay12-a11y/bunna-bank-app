import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CardEventDocument = HydratedDocument<CardEvent>;

@Schema({ collection: 'card_events', timestamps: true, versionKey: false })
export class CardEvent {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Card', index: true })
  cardId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  actorType!: 'member' | 'staff' | 'system';

  @Prop({ trim: true })
  actorId?: string;

  @Prop({ trim: true })
  actorName?: string;

  @Prop({ required: true, trim: true })
  eventType!:
    | 'requested'
    | 'locked'
    | 'unlocked'
    | 'replacement_requested'
    | 'request_status_updated';

  @Prop({ trim: true })
  note?: string;

  createdAt?: Date;

  updatedAt?: Date;
}

export const CardEventSchema = SchemaFactory.createForClass(CardEvent);
