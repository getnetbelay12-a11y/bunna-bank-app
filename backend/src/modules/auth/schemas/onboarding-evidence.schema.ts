import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OnboardingEvidenceDocument = HydratedDocument<OnboardingEvidence>;

@Schema({ _id: false, versionKey: false })
export class ExtractedFaydaData {
  @Prop()
  fullName?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  dateOfBirth?: string;

  @Prop()
  sex?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  nationality?: string;

  @Prop()
  region?: string;

  @Prop()
  city?: string;

  @Prop()
  subCity?: string;

  @Prop()
  woreda?: string;

  @Prop()
  faydaFin?: string;

  @Prop()
  serialNumber?: string;

  @Prop()
  cardNumber?: string;

  @Prop({ type: [String], default: [] })
  dateOfBirthCandidates!: string[];

  @Prop({ type: [String], default: [] })
  expiryDateCandidates!: string[];

  @Prop({ type: [String], default: [] })
  reviewRequiredFields!: string[];

  @Prop()
  extractionMethod?: string;
}

export const ExtractedFaydaDataSchema =
  SchemaFactory.createForClass(ExtractedFaydaData);

@Schema({
  collection: 'onboarding_evidence',
  timestamps: true,
  versionKey: false,
})
export class OnboardingEvidence {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', unique: true, index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  phoneNumber!: string;

  @Prop()
  faydaFrontImage?: string;

  @Prop()
  faydaBackImage?: string;

  @Prop()
  selfieImage?: string;

  @Prop({ type: ExtractedFaydaDataSchema })
  extractedFaydaData?: ExtractedFaydaData;

  createdAt?: Date;

  updatedAt?: Date;
}

export const OnboardingEvidenceSchema =
  SchemaFactory.createForClass(OnboardingEvidence);
