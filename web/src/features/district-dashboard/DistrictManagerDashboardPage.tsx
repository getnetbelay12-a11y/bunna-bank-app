import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  DistrictCommandCenterSummary,
  NotificationCategory,
  PerformancePeriod,
  RolePerformanceItem,
  RolePerformanceOverview,
} from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { ConsoleKpiStrip } from '../../shared/components/ConsoleKpiStrip';
import { CriticalActionStrip } from '../../shared/components/CriticalActionStrip';
import {
  DashboardGrid,
  DashboardMetricRow,
  DashboardPage,
  DashboardPipelineCard,
  DashboardProgressRow,
  DashboardSectionCard,
  DashboardTableCard,
  EmptyStateCard,
  QuickActionChip,
} from '../../shared/components/BankingDashboard';
import { ScopedOperationsSummaryPanel } from '../shared-layout/ScopedOperationsSummaryPanel';
import { LoanWorkflowWatchlistPanel } from '../loan-monitoring/LoanWorkflowWatchlistPanel';
import { KycWatchlistPanel } from '../manager-pages/KycWatchlistPanel';
import { AutopayOperationsPanel } from '../notifications/AutopayOperationsPanel';
import { NotificationWatchlistPanel } from '../notifications/NotificationWatchlistPanel';
import { SupportWatchlistPanel } from '../support/SupportWatchlistPanel';

type DistrictManagerDashboardPageProps = {
  session: AdminSession;
  onOpenLoan?: (loanId: string) => void;
  onOpenAutopayOperation?: (operationId: string) => void;
  onOpenSupportChat?: (conversationId: string) => void;
  onOpenNotificationCategory?: (category: NotificationCategory) => void;
  onOpenKycMember?: (memberId: string) => void;
};

const periods: PerformancePeriod[] = ['today', 'week', 'month', 'year'];

export function DistrictManagerDashboardPage({
  session,
  onOpenLoan,
  onOpenAutopayOperation,
  onOpenSupportChat,
  onOpenNotificationCategory,
  onOpenKycMember,
}: DistrictManagerDashboardPageProps) {
  const { dashboardApi } = useAppClient();
  const [period, setPeriod] = useState<PerformancePeriod>('week');
  const [overview, setOverview] = useState<RolePerformanceOverview | null>(null);
  const [topBranches, setTopBranches] = useState<RolePerformanceItem[]>([]);
  const [watchlist, setWatchlist] = useState<RolePerformanceItem[]>([]);
  const [commandCenter, setCommandCenter] =
    useState<DistrictCommandCenterSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      dashboardApi.getDistrictCommandCenter(session.role, period),
      dashboardApi.getDistrictBranchSummary(session.role, period),
      dashboardApi.getDistrictTopBranches(session.role, period),
      dashboardApi.getDistrictBranchWatchlist(session.role, period),
    ]).then(([commandCenterResult, summaryResult, topResult, watchlistResult]) => {
      if (cancelled) {
        return;
      }

      setCommandCenter(commandCenterResult);
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
  const visibleBranches =
    items.length > 0
      ? items
      : topBranches.length > 0
        ? topBranches
        : watchlist;
  const topRankedBranch =
    commandCenter?.branchRanking[0] ??
    [...visibleBranches].sort((left, right) => right.score - left.score)[0] ??
    null;
  const topApprovalBranch = commandCenter?.loanApprovalsPerBranch[0] ?? null;
  const kycCompletionRate = commandCenter?.kycCompletion.completionRate ?? 0;
  const highestQueueBranch =
    [...visibleBranches].sort((left, right) => right.pendingTasks - left.pendingTasks)[0] ?? null;
  const strongestSupportBranch =
    [...visibleBranches].sort((left, right) => right.supportResolved - left.supportResolved)[0] ?? null;

  return (
    <DashboardPage>
      <div className="district-page">
        <section className="district-mission-grid">
          <article className="district-mission-card district-mission-card-primary">
            <div className="district-mission-copy">
              <span className="eyebrow">District command</span>
              <h3>Guide branch execution with faster approvals, cleaner KYC flow, and lower support pressure.</h3>
              <p>Focus the district on high-performing branches first, then clear branches that are drifting on response time or queue posture.</p>
            </div>
            <div className="district-mission-stats">
              <div>
                <span>Branches</span>
                <strong>{commandCenter ? commandCenter.branchList.length.toLocaleString() : 'Not available'}</strong>
              </div>
              <div>
                <span>Approvals</span>
                <strong>{commandCenter ? commandCenter.loanApprovalsPerBranch.reduce((sum, item) => sum + item.approvedCount, 0).toLocaleString() : 'Not available'}</strong>
              </div>
              <div>
                <span>Top branch</span>
                <strong>{topRankedBranch?.name ?? 'Waiting for ranking'}</strong>
              </div>
              <div>
                <span>KYC posture</span>
                <strong>{commandCenter ? `${commandCenter.kycCompletion.completionRate}% complete` : 'Not available'}</strong>
              </div>
            </div>
          </article>

          <article className="district-mission-card district-mission-card-risk">
            <span className="eyebrow">Priority signals</span>
            <h3>District attention</h3>
            <ul className="district-priority-list">
              <li>
                <span>Escalation load</span>
                <strong>{watchlist.reduce((sum, item) => sum + item.loansEscalated, 0).toLocaleString()} overdue loans require district action.</strong>
              </li>
              <li>
                <span>Support pressure</span>
                <strong>{commandCenter?.supportMetrics.escalatedChats.toLocaleString() ?? '0'} chats escalated above branch handling.</strong>
              </li>
              <li>
                <span>Document risk</span>
                <strong>{commandCenter?.kycCompletion.needsAction.toLocaleString() ?? '0'} members need document correction.</strong>
              </li>
            </ul>
          </article>

          <article className="district-mission-card district-mission-card-actions">
            <span className="eyebrow">Execution snapshot</span>
            <h3>What to push next</h3>
            <div className="district-action-tiles">
              <div className="district-action-tile">
                <span className="district-action-index">1</span>
                <div className="district-action-copy">
                  <strong>{topApprovalBranch?.branchName ?? topRankedBranch?.name ?? 'No branch selected'}</strong>
                  <p>Lead branch on approvals with {topApprovalBranch?.approvedCount.toLocaleString() ?? '0'} completed this period.</p>
                </div>
              </div>
              <div className="district-action-tile">
                <span className="district-action-index">2</span>
                <div className="district-action-copy">
                  <strong>{commandCenter?.supportMetrics.openChats.toLocaleString() ?? '0'} open chats</strong>
                  <p>Balance support queues before escalations spill into district intervention.</p>
                </div>
              </div>
              <div className="district-action-tile">
                <span className="district-action-index">3</span>
                <div className="district-action-copy">
                  <strong>{watchlist.length.toLocaleString()} branches on watch</strong>
                  <p>Coach branches with weak score or rising pending task levels first.</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <ConsoleKpiStrip
          items={[
            { icon: 'BR', label: 'Branches', value: commandCenter ? commandCenter.branchList.length.toLocaleString() : 'Not available', trend: 'District coverage', trendDirection: 'neutral' },
            { icon: 'LN', label: 'Loans', value: commandCenter ? commandCenter.loanApprovalsPerBranch.reduce((sum, item) => sum + item.approvedCount, 0).toLocaleString() : 'Not available', trend: 'Approved', trendDirection: 'up' },
            { icon: 'KY', label: 'KYC Completion', value: commandCenter ? `${commandCenter.kycCompletion.completionRate}%` : 'Not available', trend: `${commandCenter?.kycCompletion.pendingReview ?? 0} pending`, trendDirection: 'neutral' },
            { icon: 'SP', label: 'Support Backlog', value: commandCenter ? commandCenter.supportMetrics.openChats.toLocaleString() : 'Not available', trend: `${commandCenter?.supportMetrics.escalatedChats ?? 0} escalated`, trendDirection: 'down' },
            { icon: 'AL', label: 'Alerts', value: watchlist.length.toLocaleString(), trend: 'Branches on watch', trendDirection: watchlist.length > 0 ? 'down' : 'up' },
          ]}
        />

        <CriticalActionStrip
          items={[
            { label: 'Overdue Loans', value: watchlist.reduce((sum, item) => sum + item.loansEscalated, 0).toLocaleString(), tone: 'red' },
            { label: 'Missing Documents', value: commandCenter ? commandCenter.kycCompletion.needsAction.toLocaleString() : '0', tone: 'orange' },
            { label: 'Support Backlog', value: commandCenter ? commandCenter.supportMetrics.openChats.toLocaleString() : '0', tone: 'amber' },
            { label: 'KYC Exceptions', value: commandCenter ? commandCenter.kycCompletion.pendingReview.toLocaleString() : '0', tone: 'amber' },
          ]}
        />

        <DashboardGrid>
          <DashboardSectionCard
            title="District Focus Board"
            description="Fast branch-level reading before you drop into branch tables and watchlists."
            action={<QuickActionChip label={`${visibleBranches.length.toLocaleString()} branches in view`} />}
          >
            <div className="dashboard-stack">
              <DashboardMetricRow
                label="Highest queue pressure"
                value={highestQueueBranch ? highestQueueBranch.pendingTasks.toLocaleString() : 'Not available'}
                note={highestQueueBranch?.name ?? 'No branch queue data yet'}
              />
              <DashboardMetricRow
                label="Strongest support branch"
                value={strongestSupportBranch ? strongestSupportBranch.supportResolved.toLocaleString() : 'Not available'}
                note={strongestSupportBranch?.name ?? 'No support ranking yet'}
              />
              <DashboardMetricRow
                label="Approval leader"
                value={topApprovalBranch?.approvedCount.toLocaleString() ?? '0'}
                note={topApprovalBranch?.branchName ?? 'No approval branch yet'}
              />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Intervention Board"
            description="District action posture across support, KYC, and watchlist branches."
          >
            <div className="dashboard-stack">
              <DashboardProgressRow
                label="Support escalation load"
                value={`${commandCenter?.supportMetrics.escalatedChats.toLocaleString() ?? '0'} escalated`}
                progress={Math.min(Math.max((commandCenter?.supportMetrics.escalatedChats ?? 0) * 16, 10), 100)}
                tone={(commandCenter?.supportMetrics.escalatedChats ?? 0) > 0 ? 'amber' : 'green'}
              />
              <DashboardProgressRow
                label="KYC completion"
                value={`${kycCompletionRate}%`}
                progress={kycCompletionRate}
                tone={kycCompletionRate >= 85 ? 'green' : kycCompletionRate >= 70 ? 'blue' : 'amber'}
              />
              <DashboardProgressRow
                label="Branches on watch"
                value={`${watchlist.length.toLocaleString()} flagged`}
                progress={Math.min(Math.max(watchlist.length * 18, 8), 100)}
                tone={watchlist.length > 0 ? 'red' : 'green'}
              />
            </div>
          </DashboardSectionCard>
        </DashboardGrid>

        <DashboardGrid>
          <DashboardSectionCard
            title="District Performance"
            description="Branch ranking and district execution in one compact view."
            action={
              <label className="field-stack">
                <span>Period</span>
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
            }
          >
            <div className="dashboard-stack">
              <DashboardMetricRow
                label="Top Branch"
                value={topRankedBranch ? `${topRankedBranch.score} score` : 'Not available'}
                note={topRankedBranch?.name ?? 'No ranked branch yet'}
              />
              {(commandCenter?.branchRanking.length ?? 0) > 0 ? (
                commandCenter?.branchRanking.slice(0, 4).map((branch) => (
                  <DashboardProgressRow
                    key={branch.name}
                    label={branch.name}
                    value={`${branch.score} score`}
                    progress={Math.min(branch.score, 100)}
                    tone={branch.score >= 85 ? 'green' : branch.score >= 70 ? 'blue' : 'amber'}
                  />
                ))
              ) : (
                <EmptyStateCard
                  title="No branch ranking yet"
                  description="District branch scoring will appear here once branch performance data is available."
                />
              )}
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Support Overview"
            description="Open chat pressure, assignment load, and response posture."
            action={<QuickActionChip label={`${commandCenter?.supportMetrics.assignedChats ?? 0} assigned`} />}
          >
            <div className="dashboard-stack">
              <DashboardMetricRow
                label="Open Chats"
                value={commandCenter?.supportMetrics.openChats.toLocaleString() ?? '0'}
                note={`${commandCenter?.supportMetrics.assignedChats.toLocaleString() ?? '0'} assigned`}
              />
              <DashboardMetricRow
                label="Escalated"
                value={commandCenter?.supportMetrics.escalatedChats.toLocaleString() ?? '0'}
                note="District queue requiring intervention"
              />
              <DashboardMetricRow
                label="Response"
                value={kpis ? `${kpis.responseTimeMinutes} min` : 'Not available'}
                note="Average handling time"
              />
            </div>
          </DashboardSectionCard>
        </DashboardGrid>

      <DashboardGrid>
        <DashboardPipelineCard
          title="District Loan Queue"
          description="Branch intake moving through district approval."
          stages={[
            { label: 'Submitted', value: `${kpis?.pendingApprovals ?? 0}`, progress: 100, tone: 'blue' },
            { label: 'Branch Review', value: `${Math.max(Math.round((kpis?.pendingApprovals ?? 0) * 0.72), 1)}`, progress: 72, tone: 'teal' },
            { label: 'District Review', value: `${Math.max(Math.round((kpis?.pendingApprovals ?? 0) * 0.46), 1)}`, progress: 46, tone: 'amber' },
            { label: 'Head Office', value: `${Math.max(Math.round((kpis?.pendingApprovals ?? 0) * 0.18), 1)}`, progress: 18, tone: 'red' },
            { label: 'Approved', value: `${topBranches.reduce((sum, item) => sum + item.loansApproved, 0)}`, progress: 34, tone: 'green' },
          ]}
        />

        <DashboardSectionCard
          title="KYC Status"
          description="Completion posture across the district branch network."
        >
          <div className="dashboard-stack">
            <DashboardMetricRow
              label="Completion Rate"
              value={`${kycCompletionRate}%`}
              note={`${commandCenter?.kycCompletion.completed.toLocaleString() ?? '0'} completed`}
            />
            <DashboardMetricRow
              label="Pending Review"
              value={commandCenter?.kycCompletion.pendingReview.toLocaleString() ?? '0'}
              note={`${commandCenter?.kycCompletion.needsAction.toLocaleString() ?? '0'} need action`}
            />
            <DashboardProgressRow
              label="District Completion"
              value={`${kycCompletionRate}%`}
              progress={kycCompletionRate}
              tone={kycCompletionRate >= 85 ? 'green' : kycCompletionRate >= 70 ? 'blue' : 'amber'}
            />
          </div>
        </DashboardSectionCard>
      </DashboardGrid>

      <ScopedOperationsSummaryPanel
        role={session.role}
        title="Operations Summary"
        description="District triage snapshot across loans, support, KYC, AutoPay, and reminder exceptions."
        onOpenAutopayOperation={onOpenAutopayOperation}
        onOpenKycMember={onOpenKycMember}
        onOpenLoan={onOpenLoan}
        onOpenNotificationCategory={onOpenNotificationCategory}
        onOpenSupportChat={onOpenSupportChat}
      />

        <DashboardGrid>
          <DashboardTableCard
            title="Branch Ranking"
            description="Top district branches with a simpler banking score table."
          headers={['Branch', 'Loans', 'KYC', 'Score', 'Action']}
            rows={
              visibleBranches.length > 0
                ? visibleBranches.map((item) => [
                    item.name,
                    item.loansHandled.toLocaleString(),
                    item.kycCompleted.toLocaleString(),
                    `${item.score}`,
                    item.status === 'needs_support' ? 'Coach' : 'Review',
                  ])
                : [['No branch ranking yet', '-', '-', '-', '-']]
            }
        />

        <DashboardSectionCard
          title="Branch Alerts"
          description="District branches needing coaching or intervention."
        >
          {watchlist.length > 0 ? (
            <div className="dashboard-stack">
              {watchlist.slice(0, 4).map((item) => (
                <DashboardProgressRow
                  key={item.entityId}
                  label={item.name}
                  value={`${item.pendingTasks} pending`}
                  progress={Math.min(Math.round((item.pendingTasks / Math.max(item.pendingTasks + item.loansEscalated, 1)) * 100), 100)}
                  tone={item.status === 'needs_support' ? 'red' : 'amber'}
                />
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title="No branch alerts"
              description="District branches are currently within normal thresholds."
            />
          )}
        </DashboardSectionCard>
      </DashboardGrid>

      <DashboardGrid>
        <LoanWorkflowWatchlistPanel
          title="Loan Workflow Watchlist"
          description="District-scoped loan cases that need escalation handling, correction follow-up, or approval review."
          emptyActionLabel="Complete district review"
          onOpenLoan={onOpenLoan}
        />

        <SupportWatchlistPanel
          title="Support Watchlist"
          description="District-scoped support chats that are unread, escalated, or at SLA risk."
          onOpenChat={onOpenSupportChat}
        />
      </DashboardGrid>

      <DashboardGrid>
        <NotificationWatchlistPanel
          title="Notification Watchlist"
          description="District-scoped reminder work, delivery failures, and insurance alert signals."
          onOpenCategory={onOpenNotificationCategory}
        />

        <AutopayOperationsPanel
          role={session.role}
          title="AutoPay Operations"
          description="District-scoped standing instructions that need monitoring, pause recovery, or reminder support."
          onOpenCategory={onOpenNotificationCategory}
          onOpenOperation={onOpenAutopayOperation}
        />
      </DashboardGrid>

      <DashboardGrid>
        <KycWatchlistPanel
          role={session.role}
          title="KYC Watchlist"
          description="District-scoped onboarding review cases that need review, correction, or approval."
          onOpenMember={onOpenKycMember}
        />
      </DashboardGrid>

      <DashboardGrid>
        <DashboardTableCard
          title="Top Branches"
          description="Highest-performing branches with compact execution metrics."
          headers={['Branch', 'Loans', 'Support', 'Response', 'Score']}
          rows={
            topBranches.length > 0
              ? topBranches.map((item) => [
                  item.name,
                  item.loansApproved.toLocaleString(),
                  item.supportResolved.toLocaleString(),
                  `${item.responseTimeMinutes} min`,
                  item.score.toLocaleString(),
                ])
              : [['No branch data yet', '-', '-', '-', '-']]
          }
        />

        <DashboardSectionCard
          title="Approval Output"
          description="Branch lending throughput and watchlist focus."
        >
          <div className="dashboard-stack">
            <DashboardMetricRow
              label="Top Approval Branch"
              value={topApprovalBranch?.approvedCount.toLocaleString() ?? '0'}
              note={topApprovalBranch?.branchName ?? 'Not available'}
            />
            {(commandCenter?.loanApprovalsPerBranch.length ?? 0) > 0 ? (
              commandCenter?.loanApprovalsPerBranch.slice(0, 4).map((item) => (
                <DashboardProgressRow
                  key={item.branchName}
                  label={item.branchName}
                  value={`${item.approvedCount} approved`}
                  progress={Math.min(
                    Math.round((item.approvedCount / Math.max(topApprovalBranch?.approvedCount ?? 1, 1)) * 100),
                    100,
                  )}
                  tone="green"
                />
              ))
            ) : (
              <EmptyStateCard
                title="No approval output yet"
                description="Branch approval throughput will appear here once district approvals are recorded."
              />
            )}
          </div>
        </DashboardSectionCard>
        </DashboardGrid>
      </div>
    </DashboardPage>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
