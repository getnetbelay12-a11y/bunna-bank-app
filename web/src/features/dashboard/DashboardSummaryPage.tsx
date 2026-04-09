import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  BranchCommandCenterSummary,
  DistrictCommandCenterSummary,
  HeadOfficeCommandCenterSummary,
  ManagerDashboardSummary,
  PerformancePeriod,
  VotingSummaryItem,
} from '../../core/api/contracts';
import {
  AdminRole,
  getManagerConsoleKind,
  type AdminSession,
} from '../../core/session';
import { KpiCard } from '../../shared/components/KpiCard';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';
import { RecommendationPanel } from '../recommendations/RecommendationPanel';

type DashboardSummaryPageProps = {
  session: AdminSession;
};

type DashboardCommandCenter =
  | { kind: 'head_office'; data: HeadOfficeCommandCenterSummary }
  | { kind: 'district'; data: DistrictCommandCenterSummary }
  | { kind: 'branch'; data: BranchCommandCenterSummary }
  | null;

type LiveFeedItem = {
  priority: 'critical' | 'watch' | 'healthy';
  scope: string;
  signal: string;
  value: string;
  action: string;
};

const spotlightMembers = [
  { memberId: 'abebe-kebede', label: 'Abebe Kebede' },
  { memberId: 'meseret-alemu', label: 'Meseret Alemu' },
  { memberId: 'mekdes-ali', label: 'Mekdes Ali' },
] as const;

const periods: PerformancePeriod[] = ['today', 'week', 'month', 'year'];

export function DashboardSummaryPage({ session }: DashboardSummaryPageProps) {
  const { dashboardApi } = useAppClient();
  const [summary, setSummary] = useState<ManagerDashboardSummary | null>(null);
  const [latestVote, setLatestVote] = useState<VotingSummaryItem | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    spotlightMembers[0].memberId,
  );
  const [period, setPeriod] = useState<PerformancePeriod>('week');
  const [commandCenter, setCommandCenter] = useState<DashboardCommandCenter>(null);
  const [refreshedLabel, setRefreshedLabel] = useState('Waiting for live data');

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      dashboardApi.getSummary(session.role),
      dashboardApi.getVotingSummary(),
      getDashboardCommandCenter(dashboardApi, session.role, period),
    ]).then(([summaryResult, votingResult, commandCenterResult]) => {
      if (cancelled) {
        return;
      }

      setSummary(summaryResult);
      setLatestVote(votingResult[0] ?? null);
      setCommandCenter(commandCenterResult);
      setRefreshedLabel(formatRefreshLabel(new Date()));
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, period, session.role]);

  const pendingLoanTotal =
    summary?.pendingLoansByLevel.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const highestLoanQueue =
    summary?.pendingLoansByLevel.reduce(
      (highest, item) => (item.count > highest.count ? item : highest),
      summary.pendingLoansByLevel[0],
    ) ?? null;
  const liveFeed = useMemo(
    () => buildLiveFeed(summary, latestVote, commandCenter),
    [commandCenter, latestVote, summary],
  );
  const spotlightRows = buildSpotlightRows(commandCenter, latestVote, summary);

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Live Dashboard</p>
          <h2>Operational command feed across loans, payments, service, and governance</h2>
          <p className="muted">
            Designed around current live-feed patterns: fast scan KPIs, ranked signals,
            exception-first lists, and immediate drill-in context.
          </p>
        </div>
      </section>

      <div className="dashboard-toolbar">
        <label className="field-stack">
          <span>Time filter</span>
          <select value={period} onChange={(event) => setPeriod(event.target.value as PerformancePeriod)}>
            {periods.map((item) => (
              <option key={item} value={item}>
                {titleCase(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="dashboard-summary-strip">
        <div className="dashboard-summary-chip">
          <span className="dashboard-summary-label">Feed refresh</span>
          <strong>{refreshedLabel}</strong>
        </div>
        <div className="dashboard-summary-chip">
          <span className="dashboard-summary-label">Priority queue</span>
          <strong>{pendingLoanTotal.toLocaleString()}</strong>
        </div>
        <div className="dashboard-summary-chip">
          <span className="dashboard-summary-label">Highest backlog</span>
          <strong>{highestLoanQueue ? formatLevel(highestLoanQueue.level) : 'None'}</strong>
        </div>
        <div className="dashboard-summary-chip">
          <span className="dashboard-summary-label">Live signals</span>
          <strong>{liveFeed.length.toLocaleString()}</strong>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          title="Customers Served"
          value={summary ? summary.customersServed.toLocaleString() : 'Not available'}
          caption={`${titleCase(period)} activity`}
          trend={
            commandCenter?.kind === 'head_office'
              ? `${commandCenter.data.totalCustomers.toLocaleString()} institution total`
              : undefined
          }
          trendTone="neutral"
          sparkline={buildSparkline(summary?.customersServed)}
        />
        <KpiCard
          title="Transactions"
          value={summary ? summary.transactionsCount.toLocaleString() : 'Not available'}
          caption="Processing volume"
          trend={
            commandCenter?.kind === 'head_office'
              ? `${commandCenter.data.pendingApprovals.toLocaleString()} pending approvals`
              : commandCenter?.kind === 'district'
                ? `${commandCenter.data.supportMetrics.openChats.toLocaleString()} support chats`
                : commandCenter?.kind === 'branch'
                  ? `${commandCenter.data.pendingTasks.toLocaleString()} pending tasks`
                  : undefined
          }
          trendTone="warning"
          sparkline={buildSparkline(summary?.transactionsCount)}
        />
        <KpiCard
          title="School Payments"
          value={summary ? summary.schoolPaymentsCount.toLocaleString() : 'Not available'}
          caption="Collections and fee traffic"
          trend={highestLoanQueue ? `${highestLoanQueue.count.toLocaleString()} loan files in queue` : undefined}
          trendTone="neutral"
          sparkline={buildSparkline(summary?.schoolPaymentsCount)}
        />
        <KpiCard
          title="Voting Participation"
          value={latestVote ? `${latestVote.participationRate.toFixed(0)}%` : 'Not available'}
          caption={latestVote ? latestVote.title : 'Latest open vote'}
          trend={
            latestVote ? `${latestVote.totalResponses.toLocaleString()} responses` : undefined
          }
          trendTone="positive"
          sparkline={buildSparkline(latestVote?.participationRate)}
        />
      </div>

      <div className="two-column-grid">
        <Panel
          title="Live Feed"
          description="Priority-ranked operational signals based on current command-center pressure."
        >
          <SimpleTable
            headers={['Priority', 'Scope', 'Signal', 'Value', 'Action']}
            rows={liveFeed.map((item) => [
              titleCase(item.priority),
              item.scope,
              item.signal,
              item.value,
              item.action,
            ])}
            emptyState={{
              title: 'No live signals available',
              description: 'Operational feed items will appear here once command-center data is loaded.',
            }}
          />
        </Panel>

        <Panel
          title="Command Center Spotlight"
          description="One-screen operational context for the current role scope."
        >
          <SimpleTable
            headers={['Signal', 'Current value', 'Context']}
            rows={spotlightRows}
            emptyState={{
              title: 'No spotlight metrics yet',
              description: 'Role-specific command-center metrics will appear here when available.',
            }}
          />
        </Panel>
      </div>

      <div className="two-column-grid">
        <Panel
          title="Pending Loans by Level"
          description="Queue depth stays visible because exception-first dashboards work better than static reporting."
        >
          <SimpleTable
            headers={['Level', 'Count', 'Priority']}
            rows={
              summary
                ? summary.pendingLoansByLevel.map((item) => [
                    formatLevel(item.level),
                    item.count.toLocaleString(),
                    item.count >= 100 ? 'Critical' : item.count >= 50 ? 'Watch' : 'Healthy',
                  ])
                : []
            }
            emptyState={{
              title: 'No pending loan backlog yet',
              description: 'Pending loan levels will appear here when summary data is available.',
            }}
          />
        </Panel>

        <Panel
          title="Recommendation Focus"
          description="Keep one customer context pinned while the live feed surfaces the next operational pressure."
        >
          <div className="recommendation-selector-row">
            {spotlightMembers.map((member) => (
              <button
                key={member.memberId}
                type="button"
                className={
                  selectedMemberId === member.memberId
                    ? 'recommendation-selector active'
                    : 'recommendation-selector'
                }
                onClick={() => setSelectedMemberId(member.memberId)}
              >
                {member.label}
              </button>
            ))}
          </div>
          <RecommendationPanel
            showSummary
            memberId={selectedMemberId}
            title="Institution Recommendation Signals"
            description="Completion, follow-up, cross-sell, and service setup signals for the manager console."
          />
        </Panel>
      </div>
    </div>
  );
}

async function getDashboardCommandCenter(
  dashboardApi: ReturnType<typeof useAppClient>['dashboardApi'],
  role: AdminRole,
  period: PerformancePeriod,
): Promise<DashboardCommandCenter> {
  switch (getManagerConsoleKind(role)) {
    case 'head_office':
      return {
        kind: 'head_office',
        data: await dashboardApi.getHeadOfficeCommandCenter(role, period),
      };
    case 'district':
      return {
        kind: 'district',
        data: await dashboardApi.getDistrictCommandCenter(role, period),
      };
    case 'branch':
      return {
        kind: 'branch',
        data: await dashboardApi.getBranchCommandCenter(role, period),
      };
    default:
      return null;
  }
}

function buildLiveFeed(
  summary: ManagerDashboardSummary | null,
  latestVote: VotingSummaryItem | null,
  commandCenter: DashboardCommandCenter,
): LiveFeedItem[] {
  const items: LiveFeedItem[] = [];

  if (summary) {
    const topLoanLevel = summary.pendingLoansByLevel.reduce(
      (highest, item) => (item.count > highest.count ? item : highest),
      summary.pendingLoansByLevel[0],
    );

    if (topLoanLevel) {
      items.push({
        priority: topLoanLevel.count >= 100 ? 'critical' : 'watch',
        scope: 'Credit queue',
        signal: `${formatLevel(topLoanLevel.level)} backlog`,
        value: `${topLoanLevel.count.toLocaleString()} files`,
        action: 'Review loan workflow queue',
      });
    }

    items.push({
      priority: summary.schoolPaymentsCount >= 500 ? 'watch' : 'healthy',
      scope: 'Payments',
      signal: 'School payment traffic',
      value: `${summary.schoolPaymentsCount.toLocaleString()} payments`,
      action: 'Track collection exceptions',
    });
  }

  if (latestVote) {
    items.push({
      priority: latestVote.participationRate < 50 ? 'watch' : 'healthy',
      scope: 'Governance',
      signal: latestVote.title,
      value: `${latestVote.participationRate.toFixed(0)}% participation`,
      action: 'Review active vote engagement',
    });
  }

  if (commandCenter?.kind === 'head_office') {
    items.unshift({
      priority: commandCenter.data.riskAlerts.totalAlerts >= 20 ? 'critical' : 'watch',
      scope: 'Institution risk',
      signal: 'Risk alert load',
      value: `${commandCenter.data.riskAlerts.totalAlerts.toLocaleString()} alerts`,
      action: `${commandCenter.data.pendingApprovals.toLocaleString()} approvals pending`,
    });
    items.push({
      priority: commandCenter.data.supportOverview.escalatedChats >= 10 ? 'watch' : 'healthy',
      scope: 'Support',
      signal: 'Escalated conversations',
      value: `${commandCenter.data.supportOverview.escalatedChats.toLocaleString()} escalated`,
      action: 'Check support operations watchlist',
    });
  }

  if (commandCenter?.kind === 'district') {
    items.unshift({
      priority:
        commandCenter.data.kycCompletion.needsAction >= 100 ? 'critical' : 'watch',
      scope: 'District KYC',
      signal: 'Members needing action',
      value: `${commandCenter.data.kycCompletion.needsAction.toLocaleString()} cases`,
      action: 'Review branch KYC queues',
    });
    items.push({
      priority:
        commandCenter.data.supportMetrics.escalatedChats >= 10 ? 'watch' : 'healthy',
      scope: 'District support',
      signal: 'Escalated chats',
      value: `${commandCenter.data.supportMetrics.escalatedChats.toLocaleString()} chats`,
      action: 'Support backlog needs follow-up',
    });
  }

  if (commandCenter?.kind === 'branch') {
    items.unshift({
      priority: commandCenter.data.pendingTasks >= 20 ? 'critical' : 'watch',
      scope: 'Branch tasks',
      signal: 'Pending task pressure',
      value: `${commandCenter.data.pendingTasks.toLocaleString()} tasks`,
      action: 'Rebalance branch workload',
    });
    items.push({
      priority: commandCenter.data.supportHandled >= 40 ? 'healthy' : 'watch',
      scope: 'Branch service',
      signal: 'Support throughput',
      value: `${commandCenter.data.supportHandled.toLocaleString()} handled`,
      action: 'Check staff turnaround',
    });
  }

  return items.slice(0, 6);
}

function buildSpotlightRows(
  commandCenter: DashboardCommandCenter,
  latestVote: VotingSummaryItem | null,
  summary: ManagerDashboardSummary | null,
) {
  if (commandCenter?.kind === 'head_office') {
    return [
      [
        'Customers vs shareholders',
        `${commandCenter.data.totalCustomers.toLocaleString()} / ${commandCenter.data.totalShareholders.toLocaleString()}`,
        'Institution coverage',
      ],
      [
        'Risk mix',
        `${commandCenter.data.riskAlerts.loanAlerts} loan • ${commandCenter.data.riskAlerts.kycAlerts} KYC`,
        `${commandCenter.data.riskAlerts.supportAlerts} support • ${commandCenter.data.riskAlerts.notificationAlerts} notification`,
      ],
      [
        'Support posture',
        `${commandCenter.data.supportOverview.openChats} open / ${commandCenter.data.supportOverview.resolvedChats} resolved`,
        `${commandCenter.data.supportOverview.escalatedChats} escalated`,
      ],
      [
        'Governance posture',
        `${commandCenter.data.governanceStatus.activeVotes} active votes`,
        `${commandCenter.data.governanceStatus.shareholderAnnouncements} announcements`,
      ],
    ];
  }

  if (commandCenter?.kind === 'district') {
    return [
      [
        'Top branch',
        commandCenter.data.branchRanking[0]?.name ?? 'Not available',
        commandCenter.data.branchRanking[0]
          ? `${commandCenter.data.branchRanking[0].score} score`
          : 'No ranked branch',
      ],
      [
        'KYC completion',
        `${commandCenter.data.kycCompletion.completionRate}%`,
        `${commandCenter.data.kycCompletion.pendingReview} review • ${commandCenter.data.kycCompletion.needsAction} action`,
      ],
      [
        'Support pressure',
        `${commandCenter.data.supportMetrics.openChats} open chats`,
        `${commandCenter.data.supportMetrics.escalatedChats} escalated`,
      ],
      [
        'Loan approvals',
        commandCenter.data.loanApprovalsPerBranch
          .reduce((sum, item) => sum + item.approvedCount, 0)
          .toLocaleString(),
        `${commandCenter.data.branchList.length} branches covered`,
      ],
    ];
  }

  if (commandCenter?.kind === 'branch') {
    return [
      [
        'Tracked employees',
        commandCenter.data.employeePerformance.items.length.toLocaleString(),
        `${commandCenter.data.employeePerformance.kpis.pendingTasks} tasks in KPI scope`,
      ],
      [
        'Loans handled',
        commandCenter.data.loansHandled.toLocaleString(),
        `${commandCenter.data.pendingTasks} pending tasks`,
      ],
      [
        'KYC completed',
        commandCenter.data.kycCompleted.toLocaleString(),
        `${commandCenter.data.supportHandled} support handled`,
      ],
      [
        'Live vote context',
        latestVote ? `${latestVote.participationRate.toFixed(0)}% participation` : 'No live vote',
        latestVote ? latestVote.title : 'Governance activity unavailable',
      ],
    ];
  }

  return [
    [
      'Customers served',
      summary ? summary.customersServed.toLocaleString() : 'Not available',
      'Summary feed',
    ],
    [
      'Transactions',
      summary ? summary.transactionsCount.toLocaleString() : 'Not available',
      'Current scope',
    ],
    [
      'School payments',
      summary ? summary.schoolPaymentsCount.toLocaleString() : 'Not available',
      'Current scope',
    ],
    [
      'Governance',
      latestVote ? `${latestVote.participationRate.toFixed(0)}%` : 'Not available',
      latestVote ? latestVote.title : 'No vote context',
    ],
  ];
}

function buildSparkline(seed?: number) {
  if (!seed) {
    return undefined;
  }

  const base = Math.max(Math.round(seed / 10), 4);
  return [base - 2, base, base - 1, base + 1, base + 2, base + 1, base + 3];
}

function formatLevel(level: string) {
  return level
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (value: string) => value.toUpperCase());
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (item) => item.toUpperCase());
}

function formatRefreshLabel(value: Date) {
  return new Intl.DateTimeFormat('en-ET', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}
