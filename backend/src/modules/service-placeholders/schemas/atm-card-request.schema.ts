import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AtmCardRequestDocument = HydratedDocument<AtmCardRequest>;

@Schema({ collection: 'atm_card_requests', timestamps: true, versionKey: false })
export class AtmCardRequest {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, trim: true, index: true })
  phoneNumber!: string;

  @Prop({ required: true, trim: true })
  region!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ required: true, trim: true })
  preferredBranch!: string;

  @Prop({ required: true, trim: true })
  faydaFrontImageUrl!: string;

  @Prop({ required: true, trim: true })
  faydaBackImageUrl!: string;

  @Prop({ trim: true })
  selfieImageUrl?: string;

  @Prop({ required: true, trim: true })
  pin!: string;

  @Prop({ default: 'submitted', index: true })
  status!: string;
}

export const AtmCardRequestSchema = SchemaFactory.createForClass(AtmCardRequest);
