import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AutopayOperationItem, NotificationCategory } from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type AutopayOperationsPageProps = {
  session: AdminSession;
  initialOperationId?: string;
  returnContextLabel?: string;
  onReturnToContext?: () => void;
  onOpenNotificationCategory?: (category: NotificationCategory) => void;
  onOpenAuditEntity?: (entityType: string, entityId: string) => void;
};

type AutopayFilter = 'all' | 'paused' | 'school_payment' | 'active';

export function AutopayOperationsPage({
  session,
  initialOperationId,
  returnContextLabel,
  onReturnToContext,
  onOpenNotificationCategory,
  onOpenAuditEntity,
}: AutopayOperationsPageProps) {
  const { auditApi, dashboardApi } = useAppClient();
  const [items, setItems] = useState<AutopayOperationItem[]>([]);
  const [history, setHistory] = useState<
    Array<{ auditId: string; actor: string; action: string; entity: string; timestamp: string }>
  >([]);
  const [selectedOperationId, setSelectedOperationId] = useState<string | undefined>(
    initialOperationId,
  );
  const [activeFilter, setActiveFilter] = useState<AutopayFilter>('all');
  const [actionMessage, setActionMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getAutopayOperations(session.role).then((result) => {
      if (!cancelled) {
        setItems(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  useEffect(() => {
    if (initialOperationId) {
      setSelectedOperationId(initialOperationId);
    }
  }, [initialOperationId]);

  useEffect(() => {
    if (!selectedOperationId) {
      setHistory([]);
      return;
    }

    let cancelled = false;

    void auditApi
      .getEntityAuditTrail('autopay_setting', selectedOperationId)
      .then((result) => {
        if (!cancelled) {
          setHistory(result);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [auditApi, selectedOperationId]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'paused') {
      return items.filter((item) => item.operationalStatus === 'paused');
    }

    if (activeFilter === 'school_payment') {
      return items.filter((item) => item.serviceType === 'school_payment');
    }

    if (activeFilter === 'active') {
      return items.filter((item) => item.operationalStatus === 'active');
    }

    return items;
  }, [activeFilter, items]);

  const prioritizedItems =
    selectedOperationId && filteredItems.some((item) => item.id === selectedOperationId)
      ? [
          ...filteredItems.filter((item) => item.id === selectedOperationId),
          ...filteredItems.filter((item) => item.id !== selectedOperationId),
        ]
      : filteredItems;
  const selectedItem = prioritizedItems[0] ?? null;

  const summary = {
    tracked: items.length,
    paused: items.filter((item) => item.operationalStatus === 'paused').length,
    schoolFees: items.filter((item) => item.serviceType === 'school_payment').length,
    active: items.filter((item) => item.operationalStatus === 'active').length,
  };

  function handleOpenReminderCenter() {
    setActionMessage(
      selectedItem
        ? `Opened AutoPay reminder follow-up for ${selectedItem.memberName}.`
        : 'Opened AutoPay reminder follow-up.',
    );
    onOpenNotificationCategory?.('autopay');
  }

  async function handleUpdateOperation(enabled: boolean) {
    if (!selectedItem || isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      const updated = await dashboardApi.updateAutopayOperation(selectedItem.id, {
        enabled,
        note: enabled
          ? 'Manager prepared standing instruction re-enable follow-up.'
          : 'Manager paused the standing instruction for review.',
      });

      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setActionMessage(
        enabled
          ? `Standing instruction re-enabled for ${updated.memberName}.`
          : `Standing instruction paused for ${updated.memberName}.`,
      );
    } finally {
      setIsUpdating(false);
    }
  }

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
        title="AutoPay Operations"
        description="Standing instruction visibility for school fees, rent, salary, and savings transfers, with pause recovery and reminder follow-up."
      >
        <div className="dashboard-summary-strip">
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Tracked instructions</span>
            <strong>{summary.tracked.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Paused instructions</span>
            <strong>{summary.paused.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">School fee autopay</span>
            <strong>{summary.schoolFees.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Active schedules</span>
            <strong>{summary.active.toLocaleString()}</strong>
          </div>
        </div>

        <div className="loan-filter-row">
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'paused', label: `Paused (${summary.paused})` },
            { id: 'school_payment', label: `School Fee (${summary.schoolFees})` },
            { id: 'active', label: `Active (${summary.active})` },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={activeFilter === filter.id ? 'loan-filter-chip active' : 'loan-filter-chip'}
              onClick={() => setActiveFilter(filter.id as AutopayFilter)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <SimpleTable
          headers={['Customer', 'Service', 'Schedule', 'Status', 'Recommended next step', 'Open workspace']}
          rows={prioritizedItems.map((item) => [
            `${item.memberName} (${item.customerId})`,
            formatLabel(item.serviceType),
            formatLabel(item.schedule),
            formatLabel(item.operationalStatus),
            item.actionRequired,
            <button
              key={item.id}
              type="button"
              className="loan-watchlist-link"
              onClick={() => setSelectedOperationId(item.id)}
            >
              Review instruction
            </button>,
          ])}
          emptyState={{
            title: 'No AutoPay instructions in this filter',
            description: 'There are no standing instructions matching the current operational filter.',
          }}
        />
      </Panel>

      {selectedItem ? (
        <Panel
          title={`Standing Instruction: ${selectedItem.memberName}`}
          description="Inspect recurring payment configuration and prepare operational follow-up."
        >
          <div className="dashboard-summary-strip">
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Service</span>
              <strong>{formatLabel(selectedItem.serviceType)}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Schedule</span>
              <strong>{formatLabel(selectedItem.schedule)}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Operational status</span>
              <strong>{formatLabel(selectedItem.operationalStatus)}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Branch</span>
              <strong>{selectedItem.branchName ?? 'Unassigned'}</strong>
            </div>
          </div>

          <SimpleTable
            headers={['Field', 'Value']}
            rows={[
              ['Customer', `${selectedItem.memberName} (${selectedItem.customerId})`],
              ['Account', selectedItem.accountId],
              ['Service', formatLabel(selectedItem.serviceType)],
              ['Schedule', formatLabel(selectedItem.schedule)],
              ['Status', formatLabel(selectedItem.operationalStatus)],
              ['Action required', selectedItem.actionRequired],
              ['Updated', selectedItem.updatedAt ?? 'Not available'],
            ]}
          />

          <div className="loan-summary-strip" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-primary" onClick={handleOpenReminderCenter}>
              Open AutoPay notification center
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onOpenAuditEntity?.('autopay_setting', selectedItem.id)}
            >
              Open full audit history
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isUpdating}
              onClick={() =>
                void handleUpdateOperation(selectedItem.operationalStatus === 'paused')
              }
            >
              {selectedItem.operationalStatus === 'paused'
                ? 'Re-enable Instruction'
                : 'Pause For Review'}
            </button>
          </div>

          {actionMessage ? <p className="muted">{actionMessage}</p> : null}

          <SimpleTable
            headers={['Actor', 'Action', 'Entity', 'Timestamp']}
            rows={history.map((item) => [
              item.actor,
              formatLabel(item.action),
              item.entity,
              item.timestamp,
            ])}
            emptyState={{
              title: 'No AutoPay action history yet',
              description: 'Pause, re-enable, and follow-up actions will appear here for the selected instruction.',
            }}
          />
        </Panel>
      ) : null}
    </div>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
