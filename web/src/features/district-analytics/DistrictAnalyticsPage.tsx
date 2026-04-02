import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { PerformanceSummaryItem } from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';
import { TrendBars } from '../../shared/components/TrendBars';

type DistrictAnalyticsPageProps = {
  session: AdminSession;
};

export function DistrictAnalyticsPage({ session }: DistrictAnalyticsPageProps) {
  const { dashboardApi } = useAppClient();
  const [items, setItems] = useState<PerformanceSummaryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getDistrictPerformance(session.role).then((result) => {
      if (!cancelled) {
        setItems(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  return (
    <div className="page-stack">
      <Panel
        title="District Analytics"
        description="District-level performance snapshots for loans, service counts, and exceptions."
      >
        <TrendBars
          items={
            items.length > 0
              ? items.map((item) => ({
                  label: formatScopeLabel(item.scopeId),
                  value: item.transactionsCount,
                }))
              : [{ label: 'Loading', value: 0 }]
          }
        />
      </Panel>

      <Panel
        title="District Summary Table"
        description="District totals across customer service, loan outcomes, and payment throughput."
      >
        <SimpleTable
          headers={['District', 'Customers', 'Rejected', 'Payments', 'Volume']}
          rows={
            items.length > 0
              ? items.map((item) => [
                  formatScopeLabel(item.scopeId),
                  String(item.customersServed),
                  String(item.loanRejectedCount),
                  String(item.schoolPaymentsCount),
                  `ETB ${item.totalTransactionAmount.toLocaleString()}`,
                ])
              : [['Loading', '...', '...', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

function formatScopeLabel(scopeId: string) {
  return scopeId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (value: string) => value.toUpperCase());
}
