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

type HeadOfficeManagerDashboardPageProps = {
  session: AdminSession;
};

const periods: PerformancePeriod[] = ['today', 'week', 'month', 'year'];

export function HeadOfficeManagerDashboardPage({
  session,
}: HeadOfficeManagerDashboardPageProps) {
  const { dashboardApi } = useAppClient();
  const [period, setPeriod] = useState<PerformancePeriod>('week');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RolePerformanceItem['status']>('all');
  const [sortBy, setSortBy] = useState<
    'score' | 'response' | 'members' | 'loans' | 'kyc' | 'support'
  >('score');
  const [overview, setOverview] = useState<RolePerformanceOverview | null>(null);
  const [topDistricts, setTopDistricts] = useState<RolePerformanceItem[]>([]);
  const [watchlist, setWatchlist] = useState<RolePerformanceItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      dashboardApi.getHeadOfficeDistrictSummary(session.role, period),
      dashboardApi.getHeadOfficeTopDistricts(session.role, period),
      dashboardApi.getHeadOfficeDistrictWatchlist(session.role, period),
    ]).then(([summaryResult, topResult, watchlistResult]) => {
      if (cancelled) {
        return;
      }

      setOverview(summaryResult);
      setTopDistricts(topResult);
      setWatchlist(watchlistResult);
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, period, session.role]);

  const items = overview?.items ?? [];
  const kpis = overview?.kpis;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        (item.districtName ?? '').toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => compareDistricts(left, right, sortBy));

  const maxMembers = Math.max(...items.map((item) => item.membersServed), 1);
  const maxLoans = Math.max(...items.map((item) => item.loansHandled), 1);
  const maxKyc = Math.max(...items.map((item) => item.kycCompleted), 1);
  const maxSupport = Math.max(...items.map((item) => item.supportResolved), 1);
  const maxScore = Math.max(...items.map((item) => item.score), 1);
  const selectedDistrict =
    filteredItems.find((item) => item.entityId === selectedDistrictId) ??
    items.find((item) => item.entityId === selectedDistrictId) ??
    null;

  return (
    <div className="page-stack">
      <section className="hero hero-head-office">
        <div>
          <p className="eyebrow">Executive Performance</p>
          <h2>District Performance</h2>
          <p className="muted">
            District Performance Overview, Top Districts, District Watchlist,
            and Institution-wide KPIs for head office leadership.
          </p>
        </div>
        <div className="hero-badges">
          <span className="badge badge-info">District performance</span>
          <span className="badge">Role: {session.role.replace(/_/g, ' ')}</span>
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
          title="Members Served"
          value={kpis ? kpis.membersServed.toLocaleString() : '...'}
          caption="Institution-wide KPI"
          trend="+8.2% vs last week"
          trendTone="positive"
          sparkline={[42, 48, 45, 57, 60, 58, 66]}
        />
        <KpiCard
          title="Loans Processed"
          value={kpis ? kpis.loansHandled.toLocaleString() : '...'}
          caption="Institution-wide KPI"
          trend="+5.4% vs last week"
          trendTone="positive"
          sparkline={[18, 22, 24, 26, 29, 31, 33]}
        />
        <KpiCard
          title="KYC Completed"
          value={kpis ? kpis.kycCompleted.toLocaleString() : '...'}
          caption="Institution-wide KPI"
          trend="+3.1% vs last week"
          trendTone="neutral"
          sparkline={[31, 34, 32, 36, 39, 37, 41]}
        />
        <KpiCard
          title="Pending Approvals"
          value={kpis ? kpis.pendingApprovals.toLocaleString() : '...'}
          caption="Institution-wide KPI"
          trend="-2.6% vs last week"
          trendTone="warning"
          sparkline={[20, 19, 18, 17, 15, 14, 13]}
        />
      </div>

      <div className="dashboard-primary-stack">
        <Panel
          title="District Performance Summary"
          description="Executive comparison across districts with institution-wide service signals and intervention priorities."
        >
          <div className="dashboard-summary-strip">
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Top district</span>
              <strong>
                {topDistricts[0] ? `${topDistricts[0].name} (${topDistricts[0].score})` : '...'}
              </strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Weak district</span>
              <strong>
                {watchlist[0] ? `${watchlist[0].name} (${watchlist[0].score})` : '...'}
              </strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Transactions processed</span>
              <strong>{kpis ? kpis.transactionsProcessed.toLocaleString() : '...'}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Average response time</span>
              <strong>{kpis ? `${kpis.responseTimeMinutes} min` : '...'}</strong>
            </div>
          </div>

          <div className="dashboard-toolbar">
            <label className="field-stack">
              <span>Search District</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by district name"
              />
            </label>
            <label className="field-stack">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | RolePerformanceItem['status'])
                }
              >
                <option value="all">All statuses</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="watch">Watch</option>
                <option value="needs_support">Critical</option>
              </select>
            </label>
            <label className="field-stack">
              <span>Sort By</span>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as
                      | 'score'
                      | 'response'
                      | 'members'
                      | 'loans'
                      | 'kyc'
                      | 'support',
                  )
                }
              >
                <option value="score">Score</option>
                <option value="response">Response time</option>
                <option value="members">Members</option>
                <option value="loans">Loans</option>
                <option value="kyc">KYC</option>
                <option value="support">Support</option>
              </select>
            </label>
          </div>

          <div className="district-performance-wrap">
            <div className="district-performance-board">
              <div className="district-performance-header">
                <span>District</span>
                <span>Members</span>
                <span>Loans</span>
                <span>KYC</span>
                <span>Support</span>
                <span>Response</span>
                <span>Score</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <article
                    key={item.entityId}
                    className="district-performance-row"
                    onClick={() => setSelectedDistrictId(item.entityId)}
                  >
                    <div className="district-name-cell">
                      <strong>{item.name}</strong>
                      <span className="muted">
                        {item.pendingTasks.toLocaleString()} pending tasks
                      </span>
                    </div>
                    <MetricBar
                      value={item.membersServed}
                      max={maxMembers}
                      tone="primary"
                      label={item.membersServed.toLocaleString()}
                    />
                    <MetricBar
                      value={item.loansHandled}
                      max={maxLoans}
                      tone="secondary"
                      label={item.loansHandled.toLocaleString()}
                    />
                    <MetricBar
                      value={item.kycCompleted}
                      max={maxKyc}
                      tone="success"
                      label={item.kycCompleted.toLocaleString()}
                    />
                    <MetricBar
                      value={item.supportResolved}
                      max={maxSupport}
                      tone="accent"
                      label={item.supportResolved.toLocaleString()}
                    />
                    <div className="district-response-cell">{item.responseTimeMinutes} min</div>
                    <MetricBar
                      value={item.score}
                      max={maxScore}
                      tone={scoreTone(item.status)}
                      label={`${item.score}`}
                    />
                    <div className="district-status-cell">
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="district-action-cell">
                      <button
                        type="button"
                        className="district-action-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedDistrictId(item.entityId);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="district-empty-state">
                  No districts match the current search and filter selection.
                </div>
              )}
            </div>
          </div>

          {selectedDistrict ? (
            <div className="panel district-detail-panel">
              <div className="panel-header">
                <div>
                  <h2>{selectedDistrict.name}</h2>
                  <p className="muted">
                    Review district momentum, pending workload, response posture, and next intervention priority.
                  </p>
                </div>
              </div>
              <div className="two-column-grid">
                <div className="trend-bars">
                  <div>
                    <div className="trend-meta">
                      <span>Transactions processed</span>
                      <strong>{selectedDistrict.transactionsProcessed.toLocaleString()}</strong>
                    </div>
                    <div className="trend-track">
                      <div
                        className="trend-fill"
                        style={{
                          width: `${Math.min(
                            (selectedDistrict.transactionsProcessed /
                              Math.max(kpis?.transactionsProcessed ?? 1, 1)) *
                              100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="trend-meta">
                      <span>Escalated loans</span>
                      <strong>{selectedDistrict.loansEscalated.toLocaleString()}</strong>
                    </div>
                    <div className="trend-track">
                      <div
                        className="trend-fill"
                        style={{
                          width: `${Math.min(
                            (selectedDistrict.loansEscalated /
                              Math.max(selectedDistrict.pendingApprovals, 1)) *
                              100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="trend-bars">
                  <div className="trend-meta">
                    <span>Status</span>
                    <StatusBadge status={selectedDistrict.status} />
                  </div>
                  <div className="trend-meta">
                    <span>Pending approvals</span>
                    <strong>{selectedDistrict.pendingApprovals.toLocaleString()}</strong>
                  </div>
                  <div className="trend-meta">
                    <span>District action</span>
                    <span className="muted">
                      {selectedDistrict.status === 'needs_support'
                        ? 'Escalate support playbook'
                        : 'Continue monitored execution'}
                    </span>
                  </div>
                  <div className="trend-meta">
                    <span>Predicted SLA risk</span>
                    <span className="muted">
                      {selectedDistrict.responseTimeMinutes >= 18
                        ? 'Elevated'
                        : selectedDistrict.responseTimeMinutes >= 13
                          ? 'Moderate'
                          : 'Low'}
                    </span>
                  </div>
                  <div className="trend-meta">
                    <span>Approval backlog forecast</span>
                    <strong>
                      {Math.max(
                        selectedDistrict.pendingApprovals + selectedDistrict.loansEscalated * 2,
                        0,
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="two-column-grid">
        <Panel title="Top Districts" description="Best-performing districts in the selected period.">
          <SimpleTable
            headers={['District', 'Loans', 'Transactions', 'Pending', 'Score']}
            rows={
              topDistricts.length > 0
                ? topDistricts.map((item) => [
                    item.name,
                    item.loansHandled.toLocaleString(),
                    item.transactionsProcessed.toLocaleString(),
                    item.pendingApprovals.toLocaleString(),
                    item.score.toLocaleString(),
                  ])
                : [['Loading', '...', '...', '...', '...']]
            }
          />
        </Panel>

        <Panel title="District Watchlist" description="Districts needing intervention or support.">
          <SimpleTable
            headers={['District', 'Pending Tasks', 'Escalated Loans', 'Response', 'Status']}
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

function compareDistricts(
  left: RolePerformanceItem,
  right: RolePerformanceItem,
  sortBy: 'score' | 'response' | 'members' | 'loans' | 'kyc' | 'support',
) {
  switch (sortBy) {
    case 'response':
      return left.responseTimeMinutes - right.responseTimeMinutes;
    case 'members':
      return right.membersServed - left.membersServed;
    case 'loans':
      return right.loansHandled - left.loansHandled;
    case 'kyc':
      return right.kycCompleted - left.kycCompleted;
    case 'support':
      return right.supportResolved - left.supportResolved;
    case 'score':
    default:
      return right.score - left.score;
  }
}

function MetricBar({
  value,
  max,
  label,
  tone,
}: {
  value: number;
  max: number;
  label: string;
  tone: 'primary' | 'secondary' | 'success' | 'accent' | 'warning';
}) {
  const width = Math.max((value / Math.max(max, 1)) * 100, 10);

  return (
    <div className="metric-bar-cell">
      <div className="metric-bar-header">
        <span className="metric-bar-label">{label}</span>
      </div>
      <div className="metric-bar-track">
        <div
          className={`metric-bar-fill ${tone}`}
          style={{ width: `${Math.min(width, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RolePerformanceItem['status'] }) {
  return <span className={`status-badge ${status}`}>{formatStatusLabel(status)}</span>;
}

function formatStatusLabel(status: RolePerformanceItem['status']) {
  if (status === 'needs_support') {
    return 'Critical';
  }

  return formatLabel(status);
}

function scoreTone(status: RolePerformanceItem['status']) {
  if (status === 'excellent') {
    return 'warning';
  }

  if (status === 'needs_support') {
    return 'accent';
  }

  return 'primary';
}
