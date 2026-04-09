import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { PerformanceSummaryItem } from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';
import { TrendBars } from '../../shared/components/TrendBars';

type BranchAnalyticsPageProps = {
  session: AdminSession;
};

export function BranchAnalyticsPage({ session }: BranchAnalyticsPageProps) {
  const { dashboardApi } = useAppClient();
  const [items, setItems] = useState<PerformanceSummaryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getBranchPerformance(session.role).then((result) => {
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
        title="Branch Analytics"
        description="Compare customer service volume, loan approvals, and payment throughput by branch."
      >
        <TrendBars
          items={items.map((item) => ({
            label: formatScopeLabel(item.scopeId),
            value: item.customersServed,
          }))}
          emptyState={{
            title: 'No branch trend data',
            description: 'Branch service and throughput trends will appear here when analytics data is available.',
          }}
        />
      </Panel>

      <Panel
        title="Branch Performance Table"
        description="Customer service, payments, approvals, and volume by branch."
      >
        <SimpleTable
          headers={['Branch', 'Customers', 'Transactions', 'Approvals', 'Volume']}
          rows={items.map((item) => [
            formatScopeLabel(item.scopeId),
            String(item.customersServed),
            String(item.transactionsCount),
            String(item.loanApprovedCount),
            `ETB ${item.totalTransactionAmount.toLocaleString()}`,
          ])}
          emptyState={{
            title: 'No branch performance records',
            description: 'Branch performance rows will appear here when data is available for the selected scope.',
          }}
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
