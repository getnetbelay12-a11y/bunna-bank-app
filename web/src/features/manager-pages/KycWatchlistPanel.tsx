import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { OnboardingReviewItem } from '../../core/api/contracts';
import type { AdminRole } from '../../core/session';
import { isKycAttention } from '../shared-layout/attentionRules';
import { renderPanelAction } from '../shared-layout/panelHelpers';
import { useAttentionView } from '../shared-layout/useAttentionView';
import { WatchlistPanelFrame } from '../shared-layout/WatchlistPanelFrame';

type KycWatchlistPanelProps = {
  role: AdminRole;
  title: string;
  description: string;
  onOpenMember?: (memberId: string) => void;
};

export function KycWatchlistPanel({
  role,
  title,
  description,
  onOpenMember,
}: KycWatchlistPanelProps) {
  const { dashboardApi } = useAppClient();
  const [items, setItems] = useState<OnboardingReviewItem[]>([]);

  useEffect(() => {
    let active = true;

    void dashboardApi
      .getOnboardingReviewQueue(role)
      .then((result) => {
        if (active) {
          setItems(result.slice(0, 4));
        }
      })
      .catch(() => {
        if (active) {
          setItems([]);
        }
      });

    return () => {
      active = false;
    };
  }, [dashboardApi, role]);

  const submittedCount = useMemo(
    () => items.filter((item) => item.onboardingReviewStatus === 'submitted').length,
    [items],
  );
  const reviewCount = useMemo(
    () => items.filter((item) => item.onboardingReviewStatus === 'review_in_progress').length,
    [items],
  );
  const needsActionCount = useMemo(
    () => items.filter((item) => item.onboardingReviewStatus === 'needs_action').length,
    [items],
  );
  const approvedReadyCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.identityVerificationStatus === 'verified' ||
          item.kycStatus === 'verified',
      ).length,
    [items],
  );
  const needsAttentionItems = useMemo(
    () => items.filter(isKycAttention),
    [items],
  );
  const { activeView, activeViewLabel, filterOptions, setActiveView, visibleItems } =
    useAttentionView(items, needsAttentionItems);

  return (
    <WatchlistPanelFrame
      title={title}
      description={description}
      filterRow={
        <div className="loan-filter-row">
          {filterOptions.map((view) => (
            <button
              key={view.id}
              type="button"
              className={activeView === view.id ? 'loan-filter-chip active' : 'loan-filter-chip'}
              onClick={() => setActiveView(view.id)}
            >
              {view.label}
            </button>
          ))}
        </div>
      }
      summaryChips={[
        { label: 'Current focus', value: activeViewLabel },
        { label: 'Submitted', value: submittedCount.toLocaleString() },
        { label: 'In Review', value: reviewCount.toLocaleString() },
        { label: 'Needs Action', value: needsActionCount.toLocaleString() },
        { label: 'Verification Ready', value: approvedReadyCount.toLocaleString() },
      ]}
      tableHeaders={['Customer', 'Review Status', 'Identity State', 'Action']}
      tableRows={visibleItems.map((item) => [
        `${item.memberName} (${item.customerId})`,
        item.onboardingReviewStatus.replace(/_/g, ' '),
        `${item.identityVerificationStatus} / ${item.kycStatus}`,
        renderPanelAction(
          'Open review',
          onOpenMember ? () => onOpenMember(item.memberId) : undefined,
        ),
      ])}
      emptyState={{
        title: 'No KYC reviews in this view',
        description: 'This KYC watchlist filter has no visible onboarding review items right now.',
      }}
    />
  );
}
