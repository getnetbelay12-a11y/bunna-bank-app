import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AutopayOperationItem, NotificationCategory } from '../../core/api/contracts';
import type { AdminRole } from '../../core/session';
import { isAutopayAttention } from '../shared-layout/attentionRules';
import { formatPanelLabel, renderPanelAction } from '../shared-layout/panelHelpers';
import { useAttentionView } from '../shared-layout/useAttentionView';
import { WatchlistPanelFrame } from '../shared-layout/WatchlistPanelFrame';

type AutopayOperationsPanelProps = {
  role: AdminRole;
  title: string;
  description: string;
  onOpenCategory?: (category: NotificationCategory) => void;
  onOpenOperation?: (operationId: string) => void;
};

export function AutopayOperationsPanel({
  role,
  title,
  description,
  onOpenCategory,
  onOpenOperation,
}: AutopayOperationsPanelProps) {
  const { dashboardApi } = useAppClient();
  const [items, setItems] = useState<AutopayOperationItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getAutopayOperations(role).then((result) => {
      if (!cancelled) {
        setItems(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, role]);

  const pausedItems = useMemo(
    () => items.filter((item) => item.operationalStatus === 'paused'),
    [items],
  );
  const schoolPaymentItems = useMemo(
    () => items.filter((item) => item.serviceType === 'school_payment'),
    [items],
  );
  const activeItems = useMemo(
    () => items.filter((item) => item.operationalStatus === 'active'),
    [items],
  );
  const needsAttentionItems = useMemo(
    () => items.filter(isAutopayAttention),
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
        { label: 'Tracked instructions', value: items.length.toLocaleString() },
        { label: 'Paused items', value: pausedItems.length.toLocaleString() },
        { label: 'School fee autopay', value: schoolPaymentItems.length.toLocaleString() },
        { label: 'Active schedules', value: activeItems.length.toLocaleString() },
      ]}
      tableHeaders={['Customer', 'Service', 'Schedule', 'Status', 'Recommended next step', 'Open workspace']}
      tableRows={visibleItems.slice(0, 4).map((item) => [
        `${item.memberName} (${item.customerId})`,
        formatPanelLabel(item.serviceType),
        formatPanelLabel(item.schedule),
        formatPanelLabel(item.operationalStatus),
        item.actionRequired,
        renderPanelAction(
          onOpenOperation ? 'Review instruction' : 'Open AutoPay reminders',
          onOpenOperation
            ? () => onOpenOperation(item.id)
            : onOpenCategory
              ? () => onOpenCategory('autopay')
              : undefined,
        ),
      ])}
      emptyState={{
        title: 'No AutoPay instructions in this view',
        description: 'This AutoPay filter has no visible standing-instruction work right now.',
      }}
    />
  );
}
