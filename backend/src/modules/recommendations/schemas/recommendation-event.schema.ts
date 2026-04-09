import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import {
  RECOMMENDATION_ACTOR_TYPES,
  RECOMMENDATION_EVENT_TYPES,
  RecommendationActorType,
  RecommendationEventType,
} from '../recommendation.constants';

export type RecommendationEventDocument = HydratedDocument<RecommendationEvent>;

@Schema({
  collection: 'recommendation_events',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class RecommendationEvent {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Recommendation', index: true })
  recommendationId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  customerId!: string;

  @Prop({ required: true, enum: RECOMMENDATION_EVENT_TYPES, index: true })
  eventType!: RecommendationEventType;

  @Prop({ required: true, enum: RECOMMENDATION_ACTOR_TYPES, index: true })
  actorType!: RecommendationActorType;

  @Prop({ trim: true })
  actorId?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  createdAt?: Date;
}

export const RecommendationEventSchema =
  SchemaFactory.createForClass(RecommendationEvent);

RecommendationEventSchema.index({ recommendationId: 1, eventType: 1, createdAt: -1 });
RecommendationEventSchema.index({ memberId: 1, eventType: 1, createdAt: -1 });
