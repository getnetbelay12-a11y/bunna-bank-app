import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  PerformancePeriod,
  PerformanceSummaryItem,
  RolePerformanceItem,
  RolePerformanceOverview,
} from '../../core/api/contracts';
import { AdminRole, type AdminSession } from '../../core/session';
import { KpiCard } from '../../shared/components/KpiCard';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';
import { TrendBars } from '../../shared/components/TrendBars';

type DistrictAnalyticsPageProps = {
  session: AdminSession;
};

const periods: PerformancePeriod[] = ['today', 'week', 'month', 'year'];

export function DistrictAnalyticsPage({ session }: DistrictAnalyticsPageProps) {
  const { dashboardApi } = useAppClient();
  const isHeadOffice =
    session.role === AdminRole.HEAD_OFFICE_MANAGER ||
    session.role === AdminRole.HEAD_OFFICE_DIRECTOR ||
    session.role === AdminRole.HEAD_OFFICE_OFFICER ||
    session.role === AdminRole.ADMIN;
  const [period, setPeriod] = useState<PerformancePeriod>('week');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'transactions' | 'members' | 'loans' | 'score'>('transactions');
  const [overview, setOverview] = useState<RolePerformanceOverview | null>(null);
  const [legacyItems, setLegacyItems] = useState<PerformanceSummaryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (isHeadOffice) {
      void dashboardApi.getHeadOfficeDistrictSummary(session.role, period).then((result) => {
        if (!cancelled) {
          setOverview(result);
        }
      });
    } else {
      void dashboardApi.getDistrictPerformance(session.role).then((result) => {
        if (!cancelled) {
          setLegacyItems(result);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, isHeadOffice, period, session.role]);

  const roleItems = overview?.items ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRoleItems = useMemo(() => {
    return [...roleItems]
      .filter((item) =>
        normalizedSearch.length === 0
          ? true
          : item.name.toLowerCase().includes(normalizedSearch) ||
            (item.districtName ?? '').toLowerCase().includes(normalizedSearch),
      )
      .sort((left, right) => {
        if (sortBy === 'members') {
          return right.membersServed - left.membersServed;
        }
        if (sortBy === 'loans') {
          return right.loansHandled - left.loansHandled;
        }
        if (sortBy === 'score') {
          return right.score - left.score;
        }
        return right.transactionsProcessed - left.transactionsProcessed;
      });
  }, [normalizedSearch, roleItems, sortBy]);

  if (!isHeadOffice) {
    return (
      <div className="page-stack">
        <Panel
          title="District Analytics"
          description="District-level performance snapshots for loans, service counts, and exceptions."
        >
          <TrendBars
            items={legacyItems.map((item) => ({
              label: formatScopeLabel(item.scopeId),
              value: item.transactionsCount,
            }))}
            emptyState={{
              title: 'No district trend data',
              description: 'District-level loan, service, and payment trend data will appear here when it is available.',
            }}
          />
        </Panel>

        <Panel
          title="District Summary Table"
          description="District totals across customer service, loan outcomes, and payment throughput."
        >
          <SimpleTable
            headers={['District', 'Customers', 'Rejected', 'Payments', 'Volume']}
            rows={legacyItems.map((item) => [
              formatScopeLabel(item.scopeId),
              String(item.customersServed),
              String(item.loanRejectedCount),
              String(item.schoolPaymentsCount),
              `ETB ${item.totalTransactionAmount.toLocaleString()}`,
            ])}
            emptyState={{
              title: 'No district summary rows',
              description: 'District totals will appear here when performance data is available.',
            }}
          />
        </Panel>
      </div>
    );
  }

  const kpis = overview?.kpis;

  return (
    <div className="page-stack">
      <Panel
        title="District Analytics"
        description="Head-office district comparison for service throughput, credit performance, and operational response quality."
      >
        <div className="dashboard-toolbar">
          <label className="field-stack">
            <span>Time Filter</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value as PerformancePeriod)}>
              {periods.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="field-stack">
            <span>Search District</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by district name"
            />
          </label>
          <label className="field-stack">
            <span>Sort By</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
              <option value="transactions">Transactions</option>
              <option value="members">Members</option>
              <option value="loans">Loans</option>
              <option value="score">Score</option>
            </select>
          </label>
        </div>

        <div className="kpi-grid">
          <KpiCard
            title="Members Served"
            value={kpis ? kpis.membersServed.toLocaleString() : 'Not available'}
            caption="Institution-wide KPI"
            trend="+8.2% vs last week"
            trendTone="positive"
            sparkline={[42, 48, 51, 57, 60, 63, 67]}
          />
          <KpiCard
            title="Loans Processed"
            value={kpis ? kpis.loansHandled.toLocaleString() : 'Not available'}
            caption="Institution-wide KPI"
            trend="+5.4% vs last week"
            trendTone="positive"
            sparkline={[18, 21, 24, 27, 29, 31, 33]}
          />
          <KpiCard
            title="KYC Completed"
            value={kpis ? kpis.kycCompleted.toLocaleString() : 'Not available'}
            caption="Institution-wide KPI"
            trend="+3.1% vs last week"
            trendTone="neutral"
            sparkline={[24, 27, 29, 31, 34, 36, 38]}
          />
          <KpiCard
            title="Pending Approvals"
            value={kpis ? kpis.pendingApprovals.toLocaleString() : 'Not available'}
            caption="Institution-wide KPI"
            trend="-2.6% vs last week"
            trendTone="warning"
            sparkline={[26, 24, 23, 22, 21, 20, 19]}
          />
        </div>

        <TrendBars
          items={filteredRoleItems.slice(0, 12).map((item) => ({
            label: item.name.replace(' District', ''),
            value: item.transactionsProcessed,
          }))}
          emptyState={{
            title: 'No district comparison trend data',
            description: 'District transaction comparison bars will appear here when matching district data is available.',
          }}
        />
      </Panel>

      <Panel
        title="District Performance Table"
        description="District comparison follows the same head-office summary path used in the active analytics workflow."
      >
        <SimpleTable
          headers={['District', 'Members', 'Loans', 'KYC', 'Support', 'Response', 'Score', 'Status']}
          rows={
            filteredRoleItems.length > 0
              ? filteredRoleItems.map((item) => [
                  item.name,
                  item.membersServed.toLocaleString(),
                  item.loansHandled.toLocaleString(),
                  item.kycCompleted.toLocaleString(),
                  item.supportResolved.toLocaleString(),
                  `${item.responseTimeMinutes} min`,
                  item.score.toLocaleString(),
                  formatStatusLabel(item.status),
                ])
              : []
          }
          emptyState={{
            title: 'No matching districts',
            description: 'Try a different district search or sort combination to widen the results.',
          }}
        />
      </Panel>
    </div>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatusLabel(status: RolePerformanceItem['status']) {
  if (status === 'needs_support') {
    return 'Critical';
  }

  return formatLabel(status);
}

function formatScopeLabel(scopeId: string) {
  return scopeId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (value: string) => value.toUpperCase());
}
