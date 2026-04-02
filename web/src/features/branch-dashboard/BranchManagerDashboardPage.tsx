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

type BranchManagerDashboardPageProps = {
  session: AdminSession;
};

const periods: PerformancePeriod[] = ['today', 'week', 'month', 'year'];

export function BranchManagerDashboardPage({
  session,
}: BranchManagerDashboardPageProps) {
  const { dashboardApi } = useAppClient();
  const [period, setPeriod] = useState<PerformancePeriod>('week');
  const [overview, setOverview] = useState<RolePerformanceOverview | null>(null);
  const [topEmployees, setTopEmployees] = useState<RolePerformanceItem[]>([]);
  const [watchlist, setWatchlist] = useState<RolePerformanceItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      dashboardApi.getBranchEmployeeSummary(session.role, period),
      dashboardApi.getBranchTopEmployees(session.role, period),
      dashboardApi.getBranchEmployeeWatchlist(session.role, period),
    ]).then(([summaryResult, topResult, watchlistResult]) => {
      if (cancelled) {
        return;
      }

      setOverview(summaryResult);
      setTopEmployees(topResult);
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
      <section className="hero hero-branch">
        <div>
          <p className="eyebrow">Branch Operations</p>
          <h2>Employee Performance</h2>
          <p className="muted">
            Employee Performance Overview, Top Employees, Employees Needing
            Support, and Branch Workload KPIs for branch managers.
          </p>
        </div>
        <div className="hero-badges">
          <span className="badge badge-info">Employee performance</span>
          <span className="badge">Branch-only visibility</span>
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
          caption="Branch Workload KPI"
        />
        <KpiCard
          title="Loans Handled"
          value={kpis ? kpis.loansHandled.toLocaleString() : '...'}
          caption="Branch Workload KPI"
        />
        <KpiCard
          title="Support Chats Resolved"
          value={kpis ? kpis.supportResolved.toLocaleString() : '...'}
          caption="Branch Workload KPI"
        />
        <KpiCard
          title="Pending Workload"
          value={kpis ? kpis.pendingTasks.toLocaleString() : '...'}
          caption="Branch Workload KPI"
        />
      </div>

      <div className="two-column-grid">
        <Panel
          title="Employee Performance Overview"
          description="Branch employee leaderboard with workload and turnaround context."
        >
          <SimpleTable
            headers={['Employee', 'Role', 'Customers', 'Loans', 'Tasks', 'Score']}
            rows={
              items.length > 0
                ? items.map((item) => [
                    item.name,
                    formatLabel(item.role ?? 'staff'),
                    item.customersHelped.toLocaleString(),
                    item.loansHandled.toLocaleString(),
                    item.pendingTasks.toLocaleString(),
                    `${item.score} (${formatLabel(item.status)})`,
                  ])
                : [['Loading', '...', '...', '...', '...', '...']]
            }
          />
        </Panel>

        <Panel
          title="Branch Workload KPIs"
          description="Manager view of turnaround time, approvals, and transaction load."
        >
          <SimpleTable
            headers={['Signal', 'Current Value', 'Status']}
            rows={[
              [
                'Top employee',
                topEmployees[0] ? `${topEmployees[0].name} (${topEmployees[0].score})` : '...',
                topEmployees[0] ? formatLabel(topEmployees[0].status) : '...',
              ],
              [
                'Needs support',
                watchlist[0] ? `${watchlist[0].name} (${watchlist[0].score})` : '...',
                watchlist[0] ? formatLabel(watchlist[0].status) : '...',
              ],
              [
                'Avg handling time',
                kpis ? `${kpis.avgHandlingTime} min` : '...',
                kpis && kpis.avgHandlingTime <= 20 ? 'Healthy' : 'Watch',
              ],
              [
                'Pending approvals',
                kpis ? kpis.pendingApprovals.toLocaleString() : '...',
                'Queued',
              ],
            ]}
          />
        </Panel>
      </div>

      <div className="two-column-grid">
        <Panel title="Top Employees" description="Best-performing staff members in the branch.">
          <SimpleTable
            headers={['Employee', 'KYC', 'Support', 'Transactions', 'Score']}
            rows={
              topEmployees.length > 0
                ? topEmployees.map((item) => [
                    item.name,
                    item.kycCompleted.toLocaleString(),
                    item.supportResolved.toLocaleString(),
                    item.transactionsProcessed.toLocaleString(),
                    item.score.toLocaleString(),
                  ])
                : [['Loading', '...', '...', '...', '...']]
            }
          />
        </Panel>

        <Panel title="Employees Needing Support" description="Staff below target or carrying excess backlog.">
          <SimpleTable
            headers={['Employee', 'Pending', 'Escalated', 'Response', 'Status']}
            rows={
              watchlist.length > 0
                ? watchlist.map((item) => [
                    item.name,
                    item.pendingTasks.toLocaleString(),
                    item.loansEscalated.toLocaleString(),
                    `${item.responseTimeMinutes} min`,
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
