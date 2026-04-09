import { RecommendationCandidate, RecommendationContext } from './recommendation-context.interface';

export interface RecommendationScoringPort {
  score(
    candidate: RecommendationCandidate,
    context: RecommendationContext,
  ): Promise<Pick<RecommendationCandidate, 'score' | 'priority' | 'badge'>>;
}
