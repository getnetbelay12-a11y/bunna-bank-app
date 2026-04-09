import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  RecommendationCollection,
  RecommendationDashboardSummary,
  RecommendationItem,
} from '../../core/api/contracts';
import { KpiCard } from '../../shared/components/KpiCard';
import { Panel } from '../../shared/components/Panel';

type RecommendationPanelProps = {
  memberId?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  showSummary?: boolean;
};

export function RecommendationPanel({
  memberId,
  title = 'Smart Recommendations',
  description = 'Rule-based next best actions for customers and staff workflows.',
  compact = false,
  showSummary = false,
}: RecommendationPanelProps) {
  const { recommendationApi } = useAppClient();
  const [collection, setCollection] = useState<RecommendationCollection | null>(null);
  const [summary, setSummary] = useState<RecommendationDashboardSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const requests: Array<Promise<unknown>> = [];
      if (memberId) {
        requests.push(recommendationApi.getCustomerRecommendations(memberId));
      }
      if (showSummary) {
        requests.push(recommendationApi.getDashboardSummary());
      }

      const [collectionResult, summaryResult] = await Promise.all(requests);

      if (cancelled) {
        return;
      }

      if (memberId) {
        setCollection(collectionResult as RecommendationCollection);
      }

      if (showSummary) {
        setSummary((memberId ? summaryResult : collectionResult) as RecommendationDashboardSummary);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [memberId, recommendationApi, showSummary]);

  return (
    <div className="page-stack">
      {showSummary ? (
        <div className="kpi-grid recommendation-kpi-grid">
          <KpiCard
            title="Recommendations Today"
            value={summary ? String(summary.recommendationsGeneratedToday) : 'Not available'}
            caption="Generated this day"
          />
          <KpiCard
            title="Completion Rate"
            value={summary ? `${summary.completionRate.toFixed(0)}%` : 'Not available'}
            caption="Acted on / active"
          />
          <KpiCard
            title="KYC Gaps"
            value={summary ? String(summary.customersMissingKyc) : 'Not available'}
            caption="Customers missing verification"
          />
          <KpiCard
            title="AutoPay Prospects"
            value={summary ? String(summary.customersSuitableForAutopay) : 'Not available'}
            caption={summary?.topRecommendationType ?? 'Top recommendation type not available'}
          />
        </div>
      ) : null}

      <Panel title={title} description={description}>
        <div className={compact ? 'recommendation-list compact' : 'recommendation-list'}>
          {(collection?.recommendations ?? []).map((item) => (
            <RecommendationCard key={item.id} item={item} compact={compact} />
          ))}
          {!collection?.recommendations?.length ? (
            <div className="recommendation-empty">
              Recommendation signals will appear here as customer and service activity is evaluated.
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function RecommendationCard({
  item,
  compact,
}: {
  item: RecommendationItem;
  compact: boolean;
}) {
  return (
    <article className={compact ? 'recommendation-card compact' : 'recommendation-card'}>
      <div className="recommendation-card-top">
        <span className={`recommendation-badge ${badgeTone(item.badge)}`}>{item.badge}</span>
        <span className="recommendation-score">{Math.round(item.score * 100)}% match</span>
      </div>
      <h3>{item.title}</h3>
      <p className="recommendation-description">{item.description}</p>
      <div className="recommendation-reason">{item.reason}</div>
      {!compact && item.metadata?.nextBestAction ? (
        <p className="recommendation-meta">
          Next best action: {String(item.metadata.nextBestAction).replace(/_/g, ' ')}
        </p>
      ) : null}
      <div className="recommendation-actions">
        <button type="button" className="recommendation-cta">
          {item.actionLabel}
        </button>
        <span className="recommendation-route">{item.actionRoute}</span>
      </div>
    </article>
  );
}

function badgeTone(badge: string) {
  if (badge === 'Action needed' || badge === 'Complete now') {
    return 'warning';
  }
  if (badge === 'High relevance') {
    return 'gold';
  }
  if (badge === 'Opportunity') {
    return 'teal';
  }
  return 'success';
}
