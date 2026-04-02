import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  PerformancePeriod,
  RolePerformanceItem,
  RolePerformanceOverview,
} from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { KpiCard } from '../../shared/components/KpiCard';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type DistrictManagerDashboardPageProps = {
  session: AdminSession;
};

const periods: PerformancePeriod[] = ['today', 'week', 'month', 'year'];

export function DistrictManagerDashboardPage({
  session,
}: DistrictManagerDashboardPageProps) {
  const { dashboardApi } = useAppClient();
  const [period, setPeriod] = useState<PerformancePeriod>('week');
  const [overview, setOverview] = useState<RolePerformanceOverview | null>(null);
  const [topBranches, setTopBranches] = useState<RolePerformanceItem[]>([]);
  const [watchlist, setWatchlist] = useState<RolePerformanceItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      dashboardApi.getDistrictBranchSummary(session.role, period),
      dashboardApi.getDistrictTopBranches(session.role, period),
      dashboardApi.getDistrictBranchWatchlist(session.role, period),
    ]).then(([summaryResult, topResult, watchlistResult]) => {
      if (cancelled) {
        return;
      }

      setOverview(summaryResult);
      setTopBranches(topResult);
      setWatchlist(watchlistResult);
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, period, session.role]);

  const items = overview?.items ?? [];
  const kpis = overview?.kpis;

  return (
    <div className="page-stack">
      <section className="hero hero-district">
        <div>
          <p className="eyebrow">District Oversight</p>
          <h2>Branch Performance</h2>
          <p className="muted">
            Branch Performance Overview, Top Branches, Branch Watchlist,
            and District Summary KPIs for district managers.
          </p>
        </div>
        <div className="hero-badges">
          <span className="badge badge-info">Branch performance</span>
          <span className="badge">District-only visibility</span>
        </div>
      </section>

      <div className="form-grid">
        <label className="field-stack">
          <span>Time Filter</span>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as PerformancePeriod)}
          >
            {periods.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="kpi-grid">
        <KpiCard
          title="Customers Helped"
          value={kpis ? kpis.customersHelped.toLocaleString() : '...'}
          caption="District Summary KPI"
        />
        <KpiCard
          title="Loans Handled"
          value={kpis ? kpis.loansHandled.toLocaleString() : '...'}
          caption="District Summary KPI"
        />
        <KpiCard
          title="Support Resolved"
          value={kpis ? kpis.supportResolved.toLocaleString() : '...'}
          caption="District Summary KPI"
        />
        <KpiCard
          title="Branch Response Time"
          value={kpis ? `${kpis.responseTimeMinutes} min` : '...'}
          caption="District Summary KPI"
        />
      </div>

      <div className="two-column-grid">
        <Panel
          title="Branch Performance Overview"
          description="District branch totals for loans, service, KYC, and queue pressure."
        >
          <SimpleTable
            headers={['Branch', 'Customers', 'Loans', 'KYC', 'Pending', 'Score']}
            rows={
              items.length > 0
                ? items.map((item) => [
                    item.name,
                    item.customersHelped.toLocaleString(),
                    item.loansHandled.toLocaleString(),
                    item.kycCompleted.toLocaleString(),
                    item.pendingTasks.toLocaleString(),
                    `${item.score} (${formatLabel(item.status)})`,
                  ])
                : [['Loading', '...', '...', '...', '...', '...']]
            }
          />
        </Panel>

        <Panel
          title="District Summary KPIs"
          description="Operational indicators that need district manager attention."
        >
          <SimpleTable
            headers={['Signal', 'Current Value', 'Status']}
            rows={[
              [
                'Top branch',
                topBranches[0] ? `${topBranches[0].name} (${topBranches[0].score})` : '...',
                topBranches[0] ? formatLabel(topBranches[0].status) : '...',
              ],
              [
                'Weak branch',
                watchlist[0] ? `${watchlist[0].name} (${watchlist[0].score})` : '...',
                watchlist[0] ? formatLabel(watchlist[0].status) : '...',
              ],
              [
                'Pending approvals',
                kpis ? kpis.pendingApprovals.toLocaleString() : '...',
                'Queued',
              ],
              [
                'Transactions processed',
                kpis ? kpis.transactionsProcessed.toLocaleString() : '...',
                'Tracked',
              ],
            ]}
          />
        </Panel>
      </div>

      <div className="two-column-grid">
        <Panel title="Top Branches" description="Highest-performing branches in this district.">
          <SimpleTable
            headers={['Branch', 'Loans Approved', 'Support', 'Response', 'Score']}
            rows={
              topBranches.length > 0
                ? topBranches.map((item) => [
                    item.name,
                    item.loansApproved.toLocaleString(),
                    item.supportResolved.toLocaleString(),
                    `${item.responseTimeMinutes} min`,
                    item.score.toLocaleString(),
                  ])
                : [['Loading', '...', '...', '...', '...']]
            }
          />
        </Panel>

        <Panel title="Branch Watchlist" description="Branches needing support or carrying excess backlog.">
          <SimpleTable
            headers={['Branch', 'Escalated', 'Pending', 'Handling Time', 'Status']}
            rows={
              watchlist.length > 0
                ? watchlist.map((item) => [
                    item.name,
                    item.loansEscalated.toLocaleString(),
                    item.pendingTasks.toLocaleString(),
                    `${item.avgHandlingTime} min`,
                    formatLabel(item.status),
                  ])
                : [['Loading', '...', '...', '...', '...']]
            }
          />
        </Panel>
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
