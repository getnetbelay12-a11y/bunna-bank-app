import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import {
  RECOMMENDATION_AUDIENCES,
  RECOMMENDATION_BADGES,
  RECOMMENDATION_SOURCES,
  RECOMMENDATION_STATUSES,
  RECOMMENDATION_TYPES,
  RecommendationAudience,
  RecommendationBadge,
  RecommendationSource,
  RecommendationStatus,
  RecommendationType,
} from '../recommendation.constants';

export type RecommendationDocument = HydratedDocument<Recommendation>;

@Schema({ collection: 'recommendations', timestamps: true, versionKey: false })
export class Recommendation {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  customerId!: string;

  @Prop({ required: true, enum: RECOMMENDATION_AUDIENCES, index: true })
  audienceType!: RecommendationAudience;

  @Prop({ required: true, enum: RECOMMENDATION_TYPES, index: true })
  type!: RecommendationType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, trim: true })
  reason!: string;

  @Prop({ required: true, trim: true })
  actionLabel!: string;

  @Prop({ required: true, trim: true })
  actionRoute!: string;

  @Prop({ required: true, min: 0, max: 1, index: true })
  score!: number;

  @Prop({ required: true, min: 0, max: 100, index: true })
  priority!: number;

  @Prop({ required: true, enum: RECOMMENDATION_BADGES })
  badge!: RecommendationBadge;

  @Prop({ required: true, enum: RECOMMENDATION_SOURCES, default: 'rules' })
  source!: RecommendationSource;

  @Prop({ required: true, enum: RECOMMENDATION_STATUSES, default: 'new', index: true })
  status!: RecommendationStatus;

  @Prop({ type: Types.ObjectId, index: true })
  branchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true })
  districtId?: Types.ObjectId;

  @Prop({ trim: true, index: true, unique: true })
  fingerprint!: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop()
  expiresAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const RecommendationSchema = SchemaFactory.createForClass(Recommendation);

RecommendationSchema.index({ memberId: 1, audienceType: 1, status: 1, priority: -1, score: -1 });
RecommendationSchema.index({ customerId: 1, audienceType: 1, status: 1, createdAt: -1 });
