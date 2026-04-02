import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PhoneUpdateRequestDocument = HydratedDocument<PhoneUpdateRequest>;

@Schema({ collection: 'phone_update_requests', timestamps: true, versionKey: false })
export class PhoneUpdateRequest {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  currentPhoneNumber!: string;

  @Prop({ required: true, trim: true, index: true })
  requestedPhoneNumber!: string;

  @Prop({ required: true, trim: true })
  faydaFrontImageUrl!: string;

  @Prop({ required: true, trim: true })
  faydaBackImageUrl!: string;

  @Prop({ required: true, trim: true })
  selfieImageUrl!: string;

  @Prop({ default: true })
  faydaVerificationRequired!: boolean;

  @Prop({ default: true })
  selfieVerificationRequired!: boolean;

  @Prop({ default: 'pending_review', index: true })
  status!: string;
}

export const PhoneUpdateRequestSchema =
  SchemaFactory.createForClass(PhoneUpdateRequest);
