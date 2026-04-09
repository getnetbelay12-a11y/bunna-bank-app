import { RecommendationContext, RecommendationDraft } from './recommendation-context.interface';

export interface RecommendationRule {
  id: string;
  evaluate(context: RecommendationContext): RecommendationDraft[];
}
