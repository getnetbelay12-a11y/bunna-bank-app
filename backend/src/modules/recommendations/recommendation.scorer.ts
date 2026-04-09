import { Injectable } from '@nestjs/common';

import { RecommendationScoringPort } from './interfaces';

@Injectable()
export class RuleBasedRecommendationScorer implements RecommendationScoringPort {
  async score(candidate: { score: number; priority: number; badge: string }) {
    return {
      score: Number(Math.max(0, Math.min(1, candidate.score)).toFixed(2)),
      priority: Math.max(0, Math.min(100, candidate.priority)),
      badge: candidate.badge as 'High relevance' | 'Recommended' | 'Action needed' | 'Opportunity' | 'Complete now',
    };
  }
}
