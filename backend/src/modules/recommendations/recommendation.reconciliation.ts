import { RecommendationCandidate } from './interfaces';
import { RecommendationDocument } from './schemas/recommendation.schema';
import { RECOMMENDATION_THRESHOLDS } from './recommendation.constants';

export interface RecommendationReconciliationPlan {
  create: RecommendationCandidate[];
  update: Array<{
    existingId: string;
    candidate: RecommendationCandidate;
    status: 'new' | 'viewed';
  }>;
  expireIds: string[];
}

const isWithinDays = (date: Date | undefined, now: Date, days: number) =>
  Boolean(date) && now.getTime() - date!.getTime() < days * 24 * 60 * 60 * 1000;

export function reconcileRecommendations(
  existing: RecommendationDocument[],
  candidates: RecommendationCandidate[],
  now: Date,
): RecommendationReconciliationPlan {
  const create: RecommendationCandidate[] = [];
  const update: RecommendationReconciliationPlan['update'] = [];
  const activeFingerprints = new Set(candidates.map((candidate) => candidate.fingerprint));
  const expireIds: string[] = [];

  const existingByFingerprint = new Map(
    existing.map((item) => [item.fingerprint, item]),
  );

  for (const candidate of candidates) {
    const previous = existingByFingerprint.get(candidate.fingerprint);

    if (!previous) {
      create.push(candidate);
      continue;
    }

    if (
      previous.status === 'dismissed' &&
      isWithinDays(previous.updatedAt, now, RECOMMENDATION_THRESHOLDS.dismissSuppressionDays)
    ) {
      continue;
    }

    if (
      previous.status === 'acted_on' &&
      isWithinDays(previous.updatedAt, now, RECOMMENDATION_THRESHOLDS.actedOnSuppressionDays)
    ) {
      continue;
    }

    update.push({
      existingId: previous._id.toString(),
      candidate,
      status: previous.status === 'viewed' ? 'viewed' : 'new',
    });
  }

  for (const previous of existing) {
    if (
      ['new', 'viewed'].includes(previous.status) &&
      !activeFingerprints.has(previous.fingerprint)
    ) {
      expireIds.push(previous._id.toString());
    }
  }

  return { create, update, expireIds };
}
