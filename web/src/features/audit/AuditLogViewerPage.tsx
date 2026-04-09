import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { NotificationCategory } from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type AuditLogViewerPageProps = {
  session: AdminSession;
  initialEntity?: string;
  initialEntityType?: string;
  initialEntityId?: string;
  returnContextLabel?: string;
  onReturnToContext?: () => void;
  onOpenLoan?: (loanId: string) => void;
  onOpenKycMember?: (memberId: string) => void;
  onOpenSupportChat?: (conversationId: string) => void;
  onOpenNotificationCategory?: (category: NotificationCategory) => void;
  onOpenAutopayOperation?: (operationId: string) => void;
};

type AuditCategory = 'all' | 'loan' | 'kyc' | 'support' | 'notification' | 'autopay';
type AuditTimeFocus = 'all' | 'today' | 'last7Days' | 'highSignal' | 'actionable';

export function AuditLogViewerPage({
  session,
  initialEntity,
  initialEntityType,
  initialEntityId,
  returnContextLabel,
  onReturnToContext,
  onOpenLoan,
  onOpenKycMember,
  onOpenSupportChat,
  onOpenNotificationCategory,
  onOpenAutopayOperation,
}: AuditLogViewerPageProps) {
  const { auditApi } = useAppClient();
  const [items, setItems] = useState<
    Array<{ actor: string; action: string; entity: string; timestamp: string }>
  >([]);
  const [activeFilter, setActiveFilter] = useState<AuditCategory>('all');
  const [activeTimeFocus, setActiveTimeFocus] = useState<AuditTimeFocus>('all');
  const isEntityDrilldown = Boolean(initialEntityType && initialEntityId);

  useEffect(() => {
    let cancelled = false;

    const loadAudit = initialEntityType && initialEntityId
      ? auditApi.getEntityAuditTrail(initialEntityType, initialEntityId)
      : auditApi.getByEntity(session.role);

    void loadAudit.then((result) => {
      if (!cancelled) {
        setItems(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [auditApi, initialEntityId, initialEntityType, session.role]);

  useEffect(() => {
    setActiveFilter('all');
    setActiveTimeFocus('all');
  }, [initialEntityId, initialEntityType]);

  const counts = useMemo(
    () => ({
      all: items.length,
      loan: items.filter((item) => getAuditCategory(item) === 'loan').length,
      kyc: items.filter((item) => getAuditCategory(item) === 'kyc').length,
      support: items.filter((item) => getAuditCategory(item) === 'support').length,
      notification: items.filter((item) => getAuditCategory(item) === 'notification').length,
      autopay: items.filter((item) => getAuditCategory(item) === 'autopay').length,
    }),
    [items],
  );

  const categoryFilteredItems =
    activeFilter === 'all'
      ? items
      : items.filter((item) => getAuditCategory(item) === activeFilter);
  const actionableItems = categoryFilteredItems.filter(
    (item) => getAuditTarget(item).kind !== 'none',
  );
  const filteredItems =
    activeTimeFocus === 'all'
      ? categoryFilteredItems
      : activeTimeFocus === 'actionable'
        ? actionableItems
      : categoryFilteredItems.filter((item) => matchesTimeFocus(item, activeTimeFocus));
  const filteredCounts = useMemo(
    () => ({
      loan: filteredItems.filter((item) => getAuditCategory(item) === 'loan').length,
      kyc: filteredItems.filter((item) => getAuditCategory(item) === 'kyc').length,
      support: filteredItems.filter((item) => getAuditCategory(item) === 'support').length,
      notification: filteredItems.filter((item) => getAuditCategory(item) === 'notification').length,
      autopay: filteredItems.filter((item) => getAuditCategory(item) === 'autopay').length,
      actionable: filteredItems.filter((item) => getAuditTarget(item).kind !== 'none').length,
    }),
    [filteredItems],
  );
  const timeCounts = useMemo(
    () => ({
      all: categoryFilteredItems.length,
      today: categoryFilteredItems.filter((item) => matchesTimeFocus(item, 'today')).length,
      last7Days: categoryFilteredItems.filter((item) => matchesTimeFocus(item, 'last7Days')).length,
      highSignal: categoryFilteredItems.filter((item) => matchesTimeFocus(item, 'highSignal')).length,
      actionable: actionableItems.length,
    }),
    [actionableItems, categoryFilteredItems],
  );

  const orderedItems = useMemo(
    () => [...filteredItems].sort(compareAuditPriority),
    [filteredItems],
  );

  const prioritizedItems =
    initialEntity && orderedItems.some((item) => item.entity === initialEntity)
      ? [
          ...orderedItems.filter((item) => item.entity === initialEntity),
          ...orderedItems.filter((item) => item.entity !== initialEntity),
        ]
      : orderedItems;
  const topActionableItem = prioritizedItems.find(
    (item) => getAuditTarget(item).kind !== 'none',
  );

  return (
    <div className="page-stack">
      {returnContextLabel && onReturnToContext ? (
        <div className="loan-return-banner">
          <div>
            <p className="eyebrow">Dashboard Context</p>
            <strong>Opened from {returnContextLabel}</strong>
          </div>
          <button
            type="button"
            className="loan-return-button"
            onClick={onReturnToContext}
          >
            Back to {returnContextLabel}
          </button>
        </div>
      ) : null}
      <Panel
        title="Audit Log Viewer"
        description="Inspect actor, entity, and before/after snapshots for sensitive business actions."
      >
        <div className="dashboard-summary-strip">
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">
              {isEntityDrilldown ? 'Scoped entity' : 'Priority entity'}
            </span>
            <strong>
              {initialEntityType && initialEntityId
                ? `${initialEntityType}:${initialEntityId}`
                : prioritizedItems[0]?.entity ?? 'No priority entity'}
            </strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Priority action</span>
            <strong>{prioritizedItems[0]?.action.replace(/_/g, ' ') ?? 'No audit action'}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Actor</span>
            <strong>{prioritizedItems[0]?.actor ?? 'Not available'}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Timestamp</span>
            <strong>{prioritizedItems[0]?.timestamp ?? 'Not available'}</strong>
          </div>
        </div>
        {!isEntityDrilldown ? (
          <>
            <div className="loan-filter-row">
              {[
                { id: 'all', label: `All (${counts.all})` },
                { id: 'loan', label: `Loans (${counts.loan})` },
                { id: 'kyc', label: `KYC (${counts.kyc})` },
                { id: 'support', label: `Support (${counts.support})` },
                { id: 'notification', label: `Notifications (${counts.notification})` },
                { id: 'autopay', label: `AutoPay (${counts.autopay})` },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={activeFilter === filter.id ? 'loan-filter-chip active' : 'loan-filter-chip'}
                  onClick={() => setActiveFilter(filter.id as AuditCategory)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="loan-filter-row">
              {[
                { id: 'all', label: `All Time (${timeCounts.all})` },
                { id: 'today', label: `Today (${timeCounts.today})` },
                { id: 'last7Days', label: `Last 7 Days (${timeCounts.last7Days})` },
                { id: 'highSignal', label: `High-Signal (${timeCounts.highSignal})` },
                { id: 'actionable', label: `Actionable Only (${timeCounts.actionable})` },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={activeTimeFocus === filter.id ? 'loan-filter-chip active' : 'loan-filter-chip'}
                  onClick={() => setActiveTimeFocus(filter.id as AuditTimeFocus)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
        <div className="dashboard-summary-strip">
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">
              {isEntityDrilldown ? 'Scoped audit events' : 'Active audit view'}
            </span>
            <strong>
              {isEntityDrilldown
                ? `${prioritizedItems.length.toLocaleString()} events`
                : `${formatAuditCategoryLabel(activeFilter)} • ${formatTimeFocusLabel(activeTimeFocus)} (${filteredItems.length})`}
            </strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Loan actions</span>
            <strong>{filteredCounts.loan.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">KYC changes</span>
            <strong>{filteredCounts.kyc.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Support events</span>
            <strong>{filteredCounts.support.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Notification events</span>
            <strong>{filteredCounts.notification.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">AutoPay actions</span>
            <strong>{filteredCounts.autopay.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Actionable items</span>
            <strong>{filteredCounts.actionable.toLocaleString()}</strong>
          </div>
        </div>
        {topActionableItem ? (
          <div className="loan-summary-strip">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                openAuditTarget(topActionableItem, {
                  onOpenLoan,
                  onOpenKycMember,
                  onOpenSupportChat,
                  onOpenNotificationCategory,
                  onOpenAutopayOperation,
                })
              }
            >
              Open top high-signal item
            </button>
          </div>
        ) : null}
        <SimpleTable
          headers={['Actor', 'Action', 'Entity', 'Signal', 'Actionable', 'Timestamp', 'Open workspace']}
          rows={prioritizedItems.map((item) => [
            item.actor,
            item.action.replace(/_/g, ' '),
            item.entity,
            isHighSignalAuditAction(item.action) ? 'High' : 'Normal',
            getAuditTarget(item).kind !== 'none' ? 'Yes' : 'No',
            item.timestamp,
            renderAuditOpenAction(item, {
              onOpenLoan,
              onOpenKycMember,
              onOpenSupportChat,
              onOpenNotificationCategory,
              onOpenAutopayOperation,
            }),
          ])}
          emptyState={{
            title: 'No audit events in this slice',
            description:
              activeFilter === 'all'
                ? 'There are no audit events for the current time filter.'
                : `There are no ${activeFilter} audit events for the current time filter.`,
          }}
        />
      </Panel>
    </div>
  );
}

function getAuditCategory(item: { entity: string; action: string }): Exclude<AuditCategory, 'all'> {
  const entity = item.entity.toLowerCase();
  const action = item.action.toLowerCase();

  if (entity.includes('autopay') || action.includes('autopay')) {
    return 'autopay';
  }

  if (
    entity.includes('notification') ||
    entity.includes('campaign') ||
    entity.includes('insurance') ||
    action.includes('notification') ||
    action.includes('reminder')
  ) {
    return 'notification';
  }

  if (
    entity.includes('support') ||
    entity.includes('chat') ||
    entity.includes('conversation') ||
    action.includes('support') ||
    action.includes('chat')
  ) {
    return 'support';
  }

  if (
    entity.includes('kyc') ||
    entity.includes('member_profile') ||
    entity.includes('identity') ||
    action.includes('kyc') ||
    action.includes('fayda') ||
    action.includes('member_profile')
  ) {
    return 'kyc';
  }

  return 'loan';
}

function renderAuditOpenAction(
  item: { entity: string; action: string },
  handlers: {
    onOpenLoan?: (loanId: string) => void;
    onOpenKycMember?: (memberId: string) => void;
    onOpenSupportChat?: (conversationId: string) => void;
    onOpenNotificationCategory?: (category: NotificationCategory) => void;
    onOpenAutopayOperation?: (operationId: string) => void;
  },
) {
  const target = getAuditTarget(item);

  if (target.kind === 'loan' && handlers.onOpenLoan) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => handlers.onOpenLoan?.(target.id)}
      >
        Open loan
      </button>
    );
  }

  if (target.kind === 'kyc' && handlers.onOpenKycMember) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => handlers.onOpenKycMember?.(target.id)}
      >
        Open KYC
      </button>
    );
  }

  if (target.kind === 'support' && handlers.onOpenSupportChat) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => handlers.onOpenSupportChat?.(target.id)}
      >
        Open support chat
      </button>
    );
  }

  if (target.kind === 'notification' && handlers.onOpenNotificationCategory) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => handlers.onOpenNotificationCategory?.(target.category)}
      >
        Open notification center
      </button>
    );
  }

  if (target.kind === 'autopay' && handlers.onOpenAutopayOperation) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => handlers.onOpenAutopayOperation?.(target.id)}
      >
        Open AutoPay workspace
      </button>
  );
  }

  return 'No linked workspace';
}

function openAuditTarget(
  item: { entity: string; action: string },
  handlers: {
    onOpenLoan?: (loanId: string) => void;
    onOpenKycMember?: (memberId: string) => void;
    onOpenSupportChat?: (conversationId: string) => void;
    onOpenNotificationCategory?: (category: NotificationCategory) => void;
    onOpenAutopayOperation?: (operationId: string) => void;
  },
) {
  const target = getAuditTarget(item);

  if (target.kind === 'loan') {
    handlers.onOpenLoan?.(target.id);
    return;
  }

  if (target.kind === 'kyc') {
    handlers.onOpenKycMember?.(target.id);
    return;
  }

  if (target.kind === 'support') {
    handlers.onOpenSupportChat?.(target.id);
    return;
  }

  if (target.kind === 'notification') {
    handlers.onOpenNotificationCategory?.(target.category);
    return;
  }

  if (target.kind === 'autopay') {
    handlers.onOpenAutopayOperation?.(target.id);
  }
}

function getAuditTarget(
  item: { entity: string; action: string },
):
  | { kind: 'loan'; id: string }
  | { kind: 'kyc'; id: string }
  | { kind: 'support'; id: string }
  | { kind: 'notification'; category: NotificationCategory }
  | { kind: 'autopay'; id: string }
  | { kind: 'none' } {
  const category = getAuditCategory(item);
  const parsed = parseAuditEntity(item.entity);
  const action = item.action.toLowerCase();

  if (category === 'loan') {
    return { kind: 'loan', id: parsed?.id ?? item.entity };
  }

  if (category === 'kyc' && parsed?.id) {
    return { kind: 'kyc', id: parsed.id };
  }

  if (category === 'support' && parsed?.id) {
    return { kind: 'support', id: parsed.id };
  }

  if (category === 'autopay' && parsed?.id) {
    return { kind: 'autopay', id: parsed.id };
  }

  if (category === 'notification') {
    if (action.includes('autopay') || item.entity.toLowerCase().includes('autopay')) {
      return { kind: 'notification', category: 'autopay' };
    }

    if (action.includes('kyc') || item.entity.toLowerCase().includes('kyc')) {
      return { kind: 'notification', category: 'kyc' };
    }

    if (action.includes('insurance') || item.entity.toLowerCase().includes('insurance')) {
      return { kind: 'notification', category: 'insurance' };
    }

    return { kind: 'notification', category: 'loan' };
  }

  return { kind: 'none' };
}

function parseAuditEntity(entity: string): { type: string; id: string } | null {
  if (entity.includes(':')) {
    const [type, ...rest] = entity.split(':');
    return { type, id: rest.join(':') };
  }

  const separatorIndex = entity.indexOf('_');

  if (separatorIndex > 0) {
    return {
      type: entity.slice(0, separatorIndex),
      id: entity,
    };
  }

  return null;
}

function formatAuditCategoryLabel(category: AuditCategory) {
  if (category === 'all') {
    return 'All events';
  }

  if (category === 'kyc') {
    return 'KYC';
  }

  if (category === 'autopay') {
    return 'AutoPay';
  }

  if (category === 'notification') {
    return 'Notifications';
  }

  if (category === 'support') {
    return 'Support';
  }

  return 'Loans';
}

function formatTimeFocusLabel(focus: AuditTimeFocus) {
  if (focus === 'today') {
    return 'Today';
  }

  if (focus === 'last7Days') {
    return 'Last 7 days';
  }

  if (focus === 'highSignal') {
    return 'High-signal';
  }

  if (focus === 'actionable') {
    return 'Actionable only';
  }

  return 'All time';
}

function matchesTimeFocus(
  item: { action: string; timestamp: string },
  focus: Exclude<AuditTimeFocus, 'all'>,
) {
  if (focus === 'highSignal') {
    return isHighSignalAuditAction(item.action);
  }

  const timestamp = parseAuditTimestamp(item.timestamp);

  if (!timestamp) {
    return false;
  }

  const now = new Date();
  const ageMs = now.getTime() - timestamp.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (focus === 'today') {
    return ageMs >= 0 && ageMs <= oneDayMs;
  }

  return ageMs >= 0 && ageMs <= 7 * oneDayMs;
}

function parseAuditTimestamp(value: string) {
  const parsed = Date.parse(value.includes('T') ? value : value.replace(' ', 'T'));

  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed);
}

function isHighSignalAuditAction(action: string) {
  const normalized = action.toLowerCase();

  return [
    'approve',
    'rejected',
    'reject',
    'lock',
    'unlock',
    'paused',
    'reenabled',
    'escalat',
    'overdue',
    'return_for_correction',
    'reminder',
    'failed',
    'disburse',
  ].some((token) => normalized.includes(token));
}

function compareAuditPriority(
  left: { action: string; timestamp: string; entity: string },
  right: { action: string; timestamp: string; entity: string },
) {
  const leftHighSignal = isHighSignalAuditAction(left.action) ? 1 : 0;
  const rightHighSignal = isHighSignalAuditAction(right.action) ? 1 : 0;

  if (leftHighSignal !== rightHighSignal) {
    return rightHighSignal - leftHighSignal;
  }

  const leftTimestamp = parseAuditTimestamp(left.timestamp)?.getTime() ?? 0;
  const rightTimestamp = parseAuditTimestamp(right.timestamp)?.getTime() ?? 0;

  if (leftTimestamp !== rightTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  const entityComparison = left.entity.localeCompare(right.entity);

  if (entityComparison !== 0) {
    return entityComparison;
  }

  return left.action.localeCompare(right.action);
}
