import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { LoanQueueItem } from '../../core/api/contracts';
import { formatPanelLabel, renderPanelAction } from '../shared-layout/panelHelpers';
import { useAttentionView } from '../shared-layout/useAttentionView';
import { WatchlistPanelFrame } from '../shared-layout/WatchlistPanelFrame';

type LoanWorkflowWatchlistPanelProps = {
  title: string;
  description: string;
  emptyActionLabel: string;
  onOpenLoan?: (loanId: string) => void;
};

export function LoanWorkflowWatchlistPanel({
  title,
  description,
  emptyActionLabel,
  onOpenLoan,
}: LoanWorkflowWatchlistPanelProps) {
  const { loanMonitoringApi } = useAppClient();
  const [items, setItems] = useState<LoanQueueItem[]>([]);
  const correctionHeavyCount = items.filter((item) => item.deficiencyReasons.length > 0).length;
  const approvalReadyCount = items.filter((item) =>
    item.availableActions.includes('approve'),
  ).length;
  const escalationCount = items.filter((item) =>
    item.availableActions.includes('forward'),
  ).length;
  const needsAttentionItems = items.filter(needsLoanAttention);
  const { activeView, activeViewLabel, filterOptions, setActiveView, visibleItems } =
    useAttentionView(items, needsAttentionItems);
  const freshestUpdate = resolveFreshestUpdate(items);
  const oldestPendingAge = resolveOldestPendingAge(items);

  useEffect(() => {
    let active = true;

    void loanMonitoringApi
      ?.getPendingLoans()
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
  }, [loanMonitoringApi]);

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
        { label: 'Correction-heavy', value: correctionHeavyCount.toLocaleString() },
        { label: 'Approval-ready', value: approvalReadyCount.toLocaleString() },
        { label: 'Escalation-needed', value: escalationCount.toLocaleString() },
        { label: 'Tracked queue rows', value: items.length.toLocaleString() },
        { label: 'Latest queue update', value: freshestUpdate },
        { label: 'Oldest visible case age', value: oldestPendingAge },
      ]}
      tableHeaders={['Loan', 'Customer', 'Status', 'Next workflow step', 'Open workspace']}
      tableRows={visibleItems.map((item) => [
        item.loanId,
        `${item.customerId} · ${item.memberName}`,
        formatPanelLabel(item.status),
        item.availableActions.length > 0
          ? formatActionLabel(item.availableActions[0])
          : 'No next action',
        renderPanelAction(
          buildActionCue(item, emptyActionLabel),
          onOpenLoan ? () => onOpenLoan(item.loanId) : undefined,
        ),
      ])}
      emptyState={{
        title: 'No loan cases in this view',
        description: 'This loan watchlist filter has no visible workflow items right now.',
      }}
    />
  );
}

function needsLoanAttention(item: LoanQueueItem) {
  return (
    item.deficiencyReasons.length > 0 ||
    item.availableActions.includes('approve') ||
    item.availableActions.includes('forward')
  );
}

function buildActionCue(item: LoanQueueItem, emptyActionLabel: string) {
  if (item.deficiencyReasons.length > 0) {
    return `${item.deficiencyReasons.length} correction item${
      item.deficiencyReasons.length === 1 ? '' : 's'
    }`;
  }

  if (item.availableActions.includes('approve')) {
    return 'Approval ready';
  }

  if (item.availableActions.includes('forward')) {
    return 'Needs escalation';
  }

  return emptyActionLabel;
}

function formatActionLabel(value: string) {
  if (value === 'return_for_correction') {
    return 'Return For Correction';
  }

  if (value === 'review') {
    return 'Mark Review';
  }

  return formatPanelLabel(value);
}

function resolveFreshestUpdate(items: LoanQueueItem[]) {
  const timestamps = items
    .map((item) => item.updatedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime());

  if (timestamps.length === 0) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamps[0]);
}

function resolveOldestPendingAge(items: LoanQueueItem[]) {
  const timestamps = items
    .map((item) => item.updatedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  if (timestamps.length === 0) {
    return 'Not available';
  }

  const ageInHours = Math.max(
    0,
    Math.round((Date.now() - timestamps[0].getTime()) / (1000 * 60 * 60)),
  );

  if (ageInHours < 24) {
    return `${ageInHours}h`;
  }

  const ageInDays = Math.round(ageInHours / 24);
  return `${ageInDays}d`;
}
