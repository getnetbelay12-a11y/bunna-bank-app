import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TelegramLinkCodeDocument = HydratedDocument<TelegramLinkCode>;

@Schema({ collection: 'telegram_link_codes', timestamps: true, versionKey: false })
export class TelegramLinkCode {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  customerId!: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  code!: string;

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  @Prop()
  usedAt?: Date;

  @Prop({ trim: true })
  usedByChatId?: string;
}

export const TelegramLinkCodeSchema =
  SchemaFactory.createForClass(TelegramLinkCode);

TelegramLinkCodeSchema.index({ code: 1, usedAt: 1, expiresAt: 1 });
