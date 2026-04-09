import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { RecommendationActorType, RecommendationEventType } from './recommendation.constants';
import {
  RecommendationEvent,
  RecommendationEventDocument,
} from './schemas/recommendation-event.schema';

@Injectable()
export class RecommendationAnalyticsService {
  constructor(
    @InjectModel(RecommendationEvent.name)
    private readonly recommendationEventModel: Model<RecommendationEventDocument>,
  ) {}

  async track(input: {
    recommendationId: string;
    memberId: string;
    customerId: string;
    eventType: RecommendationEventType;
    actorType: RecommendationActorType;
    actorId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.recommendationEventModel.create({
      recommendationId: new Types.ObjectId(input.recommendationId),
      memberId: new Types.ObjectId(input.memberId),
      customerId: input.customerId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId,
      metadata: input.metadata,
    });
  }
}
