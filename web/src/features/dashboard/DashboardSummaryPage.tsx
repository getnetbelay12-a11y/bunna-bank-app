import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { ManagerDashboardSummary, VotingSummaryItem } from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { KpiCard } from '../../shared/components/KpiCard';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type DashboardSummaryPageProps = {
  session: AdminSession;
};

export function DashboardSummaryPage({ session }: DashboardSummaryPageProps) {
  const { dashboardApi } = useAppClient();
  const [summary, setSummary] = useState<ManagerDashboardSummary | null>(null);
  const [latestVote, setLatestVote] = useState<VotingSummaryItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      dashboardApi.getSummary(session.role),
      dashboardApi.getVotingSummary(),
    ]).then(([summaryResult, votingResult]) => {
      if (cancelled) {
        return;
      }

      setSummary(summaryResult);
      setLatestVote(votingResult[0] ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Operational summary across branch, district, and governance flows</h2>
        </div>
      </section>

      <div className="kpi-grid">
        <KpiCard
          title="Customers Served"
          value={summary ? String(summary.customersServed) : '...'}
          caption="Current period"
        />
        <KpiCard
          title="Transactions"
          value={summary ? String(summary.transactionsCount) : '...'}
          caption="Current period"
        />
        <KpiCard
          title="School Payments"
          value={summary ? String(summary.schoolPaymentsCount) : '...'}
          caption="Current period"
        />
        <KpiCard
          title="Voting Participation"
          value={latestVote ? `${latestVote.participationRate.toFixed(0)}%` : '...'}
          caption={latestVote ? latestVote.title : 'Latest open vote'}
        />
      </div>

      <Panel
        title="Pending Loans by Level"
        description="Backlog visibility for managers and head office reviewers."
      >
        <SimpleTable
          headers={['Level', 'Count', 'Trend']}
          rows={
            summary
              ? summary.pendingLoansByLevel.map((item) => [
                  formatLevel(item.level),
                  String(item.count),
                  'Live',
                ])
              : [['Loading', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

function formatLevel(level: string) {
  return level
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (value: string) => value.toUpperCase());
}
