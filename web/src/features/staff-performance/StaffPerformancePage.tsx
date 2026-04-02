import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { StaffRankingItem } from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';
import { TrendBars } from '../../shared/components/TrendBars';

type StaffPerformancePageProps = {
  session: AdminSession;
};

export function StaffPerformancePage({ session }: StaffPerformancePageProps) {
  const { dashboardApi } = useAppClient();
  const [items, setItems] = useState<StaffRankingItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getStaffRanking(session.role).then((result) => {
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
        title="Staff Performance"
        description="Ranking, trends, and staff activity summaries for manager review."
      >
        <TrendBars
          items={
            items.length > 0
              ? items.map((item) => ({
                  label: formatStaffLabel(item.staffId),
                  value: item.score,
                }))
              : [{ label: 'Loading', value: 0 }]
          }
        />
      </Panel>

      <Panel
        title="Top Staff"
        description="Relative staff ranking based on customer service, transactions, approvals, and school payments."
      >
        <SimpleTable
          headers={['Staff', 'Customers', 'Transactions', 'Approvals', 'Score']}
          rows={
            items.length > 0
              ? items.map((item) => [
                  formatStaffLabel(item.staffId),
                  String(item.customersServed),
                  String(item.transactionsCount),
                  String(item.loanApprovedCount),
                  String(item.score),
                ])
              : [['Loading', '...', '...', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

function formatStaffLabel(staffId: string) {
  return staffId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (value: string) => value.toUpperCase());
}
