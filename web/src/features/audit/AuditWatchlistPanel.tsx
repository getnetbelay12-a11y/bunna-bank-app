import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AuditLogItem } from '../../core/api/contracts';
import type { AdminRole } from '../../core/session';
import {
  isAuditAttention,
  isAuditGovernanceEvent,
  isAuditLoanEvent,
  isAuditProfileEvent,
} from '../shared-layout/attentionRules';
import { formatPanelLabel, renderPanelAction } from '../shared-layout/panelHelpers';
import { useAttentionView } from '../shared-layout/useAttentionView';
import { WatchlistPanelFrame } from '../shared-layout/WatchlistPanelFrame';

type AuditWatchlistPanelProps = {
  role: AdminRole;
  onOpenEntity?: (entity: string) => void;
};

export function AuditWatchlistPanel({
  role,
  onOpenEntity,
}: AuditWatchlistPanelProps) {
  const { auditApi } = useAppClient();
  const [items, setItems] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void auditApi.getByEntity(role).then((result) => {
      if (!cancelled) {
        setItems(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [auditApi, role]);

  const prioritizedItems = useMemo(
    () => [...items].sort((left, right) => compareAuditPriority(left, right)),
    [items],
  );
  const governanceEvents = prioritizedItems.filter(isAuditGovernanceEvent).length;
  const loanEvents = prioritizedItems.filter(isAuditLoanEvent).length;
  const profileEvents = prioritizedItems.filter(isAuditProfileEvent).length;
  const topActionCue =
    prioritizedItems.length > 0 ? resolveAuditAction(prioritizedItems[0]) : 'No review action';
  const needsAttentionItems = prioritizedItems.filter(isAuditAttention);
  const { activeView, activeViewLabel, filterOptions, setActiveView, visibleItems } =
    useAttentionView(prioritizedItems, needsAttentionItems);

  return (
    <WatchlistPanelFrame
      title="Audit Watchlist"
      description="Sensitive business actions that need quick audit review, especially governance, credit, and profile-change activity."
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
        { label: 'Governance events', value: governanceEvents.toLocaleString() },
        { label: 'Loan actions', value: loanEvents.toLocaleString() },
        { label: 'Profile changes', value: profileEvents.toLocaleString() },
        { label: 'Top review cue', value: topActionCue },
      ]}
      tableHeaders={['Actor', 'Action', 'Entity', 'Timestamp', 'Review']}
      tableRows={visibleItems.slice(0, 4).map((item) => [
        item.actor,
        formatPanelLabel(item.action),
        item.entity,
        item.timestamp,
        renderPanelAction(
          resolveAuditAction(item),
          onOpenEntity ? () => onOpenEntity(item.entity) : undefined,
        ),
      ])}
      emptyState={{
        title: 'No audit events in this view',
        description: 'This audit watchlist filter has no visible review events right now.',
      }}
    />
  );
}

function compareAuditPriority(left: AuditLogItem, right: AuditLogItem) {
  return actionPriority(left.action) - actionPriority(right.action);
}

function actionPriority(action: string) {
  if (action.includes('vote')) {
    return 0;
  }

  if (action.includes('loan')) {
    return 1;
  }

  if (action.includes('profile')) {
    return 2;
  }

  return 3;
}

function resolveAuditAction(item: AuditLogItem) {
  if (item.action.includes('vote')) {
    return 'Review governance activity';
  }

  if (item.action.includes('loan')) {
    return 'Review credit decision trail';
  }

  if (item.action.includes('profile')) {
    return 'Review profile-change evidence';
  }

  return 'Inspect audit trail';
}
