import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  BranchCommandCenterSummary,
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

type BranchManagerDashboardPageProps = {
  session: AdminSession;
  onOpenLoan?: (loanId: string) => void;
  onOpenAutopayOperation?: (operationId: string) => void;
  onOpenSupportChat?: (conversationId: string) => void;
  onOpenNotificationCategory?: (category: NotificationCategory) => void;
  onOpenKycMember?: (memberId: string) => void;
};

const periods: PerformancePeriod[] = ['today', 'week', 'month', 'year'];

export function BranchManagerDashboardPage({
  session,
  onOpenLoan,
  onOpenAutopayOperation,
  onOpenSupportChat,
  onOpenNotificationCategory,
  onOpenKycMember,
}: BranchManagerDashboardPageProps) {
  const { dashboardApi } = useAppClient();
  const [period, setPeriod] = useState<PerformancePeriod>('week');
  const [overview, setOverview] = useState<RolePerformanceOverview | null>(null);
  const [topEmployees, setTopEmployees] = useState<RolePerformanceItem[]>([]);
  const [watchlist, setWatchlist] = useState<RolePerformanceItem[]>([]);
  const [commandCenter, setCommandCenter] =
    useState<BranchCommandCenterSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      dashboardApi.getBranchCommandCenter(session.role, period),
      dashboardApi.getBranchEmployeeSummary(session.role, period),
      dashboardApi.getBranchTopEmployees(session.role, period),
      dashboardApi.getBranchEmployeeWatchlist(session.role, period),
    ]).then(([commandCenterResult, summaryResult, topResult, watchlistResult]) => {
      if (cancelled) {
        return;
      }

      setCommandCenter(commandCenterResult);
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
  const criticalEmployees = watchlist.filter((item) => item.status === 'needs_support').length;
  const queuePressure = commandCenter?.pendingTasks ?? 0;
  const kycGap = Math.max((kpis?.pendingApprovals ?? 0) - (commandCenter?.kycCompleted ?? 0), 0);
  const visibleEmployees =
    items.length > 0
      ? items
      : topEmployees.length > 0
        ? topEmployees
        : watchlist;
  const topPerformer =
    topEmployees[0] ??
    [...visibleEmployees].sort((left, right) => right.score - left.score)[0] ??
    null;
  const topLoanCloser =
    [...visibleEmployees].sort((left, right) => right.loansHandled - left.loansHandled)[0] ?? null;
  const queueLeader =
    [...visibleEmployees].sort((left, right) => right.pendingTasks - left.pendingTasks)[0] ?? null;

  return (
    <DashboardPage>
      <div className="branch-page">
        <section className="branch-mission-grid">
          <article className="branch-mission-card branch-mission-card-primary">
            <div className="branch-mission-copy">
              <span className="eyebrow">Branch command</span>
              <h3>Run the branch like a live service desk: faster loan movement, cleaner KYC, and tighter follow-up on staff queues.</h3>
              <p>Keep frontline execution visible so supervisors can spot bottlenecks before they become escalations.</p>
            </div>
            <div className="branch-mission-stats">
              <div>
                <span>Employees</span>
                <strong>{commandCenter ? commandCenter.employeePerformance.items.length.toLocaleString() : 'Not available'}</strong>
              </div>
              <div>
                <span>Loan queue</span>
                <strong>{commandCenter ? commandCenter.loansHandled.toLocaleString() : 'Not available'}</strong>
              </div>
              <div>
                <span>Top performer</span>
                <strong>{topPerformer?.name ?? 'Waiting for ranking'}</strong>
              </div>
              <div>
                <span>Queue pressure</span>
                <strong>{queuePressure.toLocaleString()} active tasks</strong>
              </div>
            </div>
          </article>

          <article className="branch-mission-card branch-mission-card-risk">
            <span className="eyebrow">Priority signals</span>
            <h3>Frontline attention</h3>
            <ul className="branch-priority-list">
              <li>
                <span>Overdue queue</span>
                <strong>{watchlist.reduce((sum, item) => sum + item.loansEscalated, 0).toLocaleString()} overdue loans are waiting for staff follow-up.</strong>
              </li>
              <li>
                <span>KYC gaps</span>
                <strong>{kycGap.toLocaleString()} members need KYC correction or completion.</strong>
              </li>
              <li>
                <span>Staff watchlist</span>
                <strong>{criticalEmployees.toLocaleString()} employees need coaching or reassignment.</strong>
              </li>
            </ul>
          </article>

          <article className="branch-mission-card branch-mission-card-actions">
            <span className="eyebrow">Execution snapshot</span>
            <h3>What managers should do</h3>
            <div className="branch-action-tiles">
              <div className="branch-action-tile">
                <span className="branch-action-index">1</span>
                <div className="branch-action-copy">
                  <strong>{topPerformer?.name ?? 'No employee selected'}</strong>
                  <p>Best branch score at {topPerformer?.score.toLocaleString() ?? '0'} and ready for heavier queue share.</p>
                </div>
              </div>
              <div className="branch-action-tile">
                <span className="branch-action-index">2</span>
                <div className="branch-action-copy">
                  <strong>{commandCenter?.supportHandled.toLocaleString() ?? '0'} support cases handled</strong>
                  <p>Keep service response stable while clearing current pending tasks.</p>
                </div>
              </div>
              <div className="branch-action-tile">
                <span className="branch-action-index">3</span>
                <div className="branch-action-copy">
                  <strong>{watchlist.length.toLocaleString()} employees on watch</strong>
                  <p>Review staff with falling score or growing pending queue before SLA pressure rises.</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <ConsoleKpiStrip
          items={[
            { icon: 'EM', label: 'Employees', value: commandCenter ? commandCenter.employeePerformance.items.length.toLocaleString() : 'Not available', trend: 'Tracked staff', trendDirection: 'neutral' },
            { icon: 'LN', label: 'Loan Queue', value: commandCenter ? commandCenter.loansHandled.toLocaleString() : 'Not available', trend: 'Branch workload', trendDirection: 'up' },
            { icon: 'KY', label: 'KYC Queue', value: commandCenter ? commandCenter.kycCompleted.toLocaleString() : 'Not available', trend: 'Completed', trendDirection: 'up' },
            { icon: 'CH', label: 'Open Chats', value: commandCenter ? commandCenter.supportHandled.toLocaleString() : 'Not available', trend: 'Support handled', trendDirection: 'neutral' },
            { icon: 'AL', label: 'Alerts', value: watchlist.length.toLocaleString(), trend: 'Employees on watch', trendDirection: watchlist.length > 0 ? 'down' : 'up' },
          ]}
        />

        <CriticalActionStrip
          items={[
            { label: 'Overdue Loans', value: watchlist.reduce((sum, item) => sum + item.loansEscalated, 0).toLocaleString(), tone: 'red' },
            { label: 'Missing Documents', value: Math.max((kpis?.pendingApprovals ?? 0) - (commandCenter?.kycCompleted ?? 0), 0).toLocaleString(), tone: 'orange' },
            { label: 'Support Backlog', value: commandCenter ? commandCenter.pendingTasks.toLocaleString() : '0', tone: 'amber' },
            { label: 'KYC Exceptions', value: kpis ? kpis.pendingApprovals.toLocaleString() : '0', tone: 'amber' },
          ]}
        />

        <DashboardGrid>
          <DashboardSectionCard
            title="Frontline Focus Board"
            description="The fastest way to read branch execution before opening deeper queues."
            action={<QuickActionChip label={`${visibleEmployees.length.toLocaleString()} staff in view`} />}
          >
            <div className="dashboard-stack">
              <DashboardMetricRow
                label="Best loan closer"
                value={topLoanCloser ? topLoanCloser.loansHandled.toLocaleString() : 'Not available'}
                note={topLoanCloser?.name ?? 'No branch employee data yet'}
              />
              <DashboardMetricRow
                label="Highest queue pressure"
                value={queueLeader ? queueLeader.pendingTasks.toLocaleString() : queuePressure.toLocaleString()}
                note={queueLeader?.name ?? 'Current branch queue'}
              />
              <DashboardMetricRow
                label="Service stability"
                value={commandCenter?.supportHandled.toLocaleString() ?? '0'}
                note="Resolved branch support workload"
              />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Manager Quick Reads"
            description="Use these branch signals before drilling into loan or support case detail."
          >
            <div className="dashboard-stack">
              <DashboardProgressRow
                label="Queue pressure"
                value={`${queuePressure.toLocaleString()} active`}
                progress={Math.min(Math.max(queuePressure * 8, 12), 100)}
                tone={queuePressure > 10 ? 'amber' : 'blue'}
              />
              <DashboardProgressRow
                label="KYC completion"
                value={`${Math.min(
                  Math.round(((commandCenter?.kycCompleted ?? 0) / Math.max((commandCenter?.kycCompleted ?? 0) + kycGap, 1)) * 100),
                  100,
                )}%`}
                progress={Math.min(
                  Math.round(((commandCenter?.kycCompleted ?? 0) / Math.max((commandCenter?.kycCompleted ?? 0) + kycGap, 1)) * 100),
                  100,
                )}
                tone={kycGap > 20 ? 'amber' : 'green'}
              />
              <DashboardProgressRow
                label="Staff watchlist"
                value={`${criticalEmployees.toLocaleString()} flagged`}
                progress={Math.min(Math.max(criticalEmployees * 18, 8), 100)}
                tone={criticalEmployees > 0 ? 'red' : 'green'}
              />
            </div>
          </DashboardSectionCard>
        </DashboardGrid>

        <DashboardGrid>
          <DashboardSectionCard
            title="Employee Performance"
            description="Branch execution, top performers, and score posture."
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
                label="Top Performer"
                value={topPerformer ? `${topPerformer.score} score` : 'Not available'}
                note={topPerformer?.name ?? 'No employee data yet'}
              />
              {topEmployees.length > 0 ? (
                topEmployees.slice(0, 4).map((item) => (
                  <DashboardProgressRow
                    key={item.entityId}
                    label={item.name}
                    value={`${item.score} score`}
                    progress={Math.min(item.score, 100)}
                    tone={item.score >= 85 ? 'green' : item.score >= 70 ? 'blue' : 'amber'}
                  />
                ))
              ) : (
                <EmptyStateCard
                  title="No employee ranking yet"
                  description="Staff scoring will appear here once branch employee performance data is available."
                />
              )}
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Support Queue"
            description="Open branch work, SLA pressure, and daily queue load."
          >
            <div className="dashboard-stack">
              <DashboardMetricRow
                label="Pending Tasks"
                value={queuePressure.toLocaleString()}
                note="Current branch queue"
              />
              <DashboardMetricRow
                label="Support Handled"
                value={commandCenter?.supportHandled.toLocaleString() ?? '0'}
                note="Completed customer issues"
              />
              <DashboardMetricRow
                label="Critical Employees"
                value={criticalEmployees.toLocaleString()}
                note="Need coaching or intervention"
              />
            </div>
          </DashboardSectionCard>
        </DashboardGrid>

      <DashboardGrid>
        <DashboardPipelineCard
          title="Loan Queue"
          description="Branch loan flow from intake to head-office approval."
          stages={[
            { label: 'Submitted', value: `${commandCenter?.pendingTasks ?? 0}`, progress: 100, tone: 'blue' },
            { label: 'Branch Review', value: `${Math.max(Math.round((commandCenter?.pendingTasks ?? 0) * 0.7), 1)}`, progress: 70, tone: 'teal' },
            { label: 'District Review', value: `${Math.max(Math.round((commandCenter?.pendingTasks ?? 0) * 0.38), 1)}`, progress: 38, tone: 'amber' },
            { label: 'Head Office', value: `${Math.max(Math.round((commandCenter?.pendingTasks ?? 0) * 0.14), 1)}`, progress: 14, tone: 'red' },
            { label: 'Approved', value: `${kpis?.pendingApprovals ?? 0}`, progress: 25, tone: 'green' },
          ]}
        />

        <DashboardSectionCard
          title="KYC Status"
          description="Queue posture for onboarding and document completion."
        >
          <div className="dashboard-stack">
            <DashboardMetricRow
              label="KYC Completed"
              value={commandCenter?.kycCompleted.toLocaleString() ?? '0'}
              note="Closed onboarding checks"
            />
            <DashboardMetricRow
              label="Exceptions"
              value={kycGap.toLocaleString()}
              note="Members needing correction"
            />
            <DashboardProgressRow
              label="KYC Throughput"
              value={`${Math.min(
                Math.round(((commandCenter?.kycCompleted ?? 0) / Math.max((commandCenter?.kycCompleted ?? 0) + kycGap, 1)) * 100),
                100,
              )}%`}
              progress={Math.min(
                Math.round(((commandCenter?.kycCompleted ?? 0) / Math.max((commandCenter?.kycCompleted ?? 0) + kycGap, 1)) * 100),
                100,
              )}
              tone={kycGap > 20 ? 'amber' : 'green'}
            />
          </div>
        </DashboardSectionCard>
      </DashboardGrid>

      <ScopedOperationsSummaryPanel
        role={session.role}
        title="Operations Summary"
        description="Branch triage snapshot across loans, support, KYC, AutoPay, and reminder exceptions."
        onOpenAutopayOperation={onOpenAutopayOperation}
        onOpenKycMember={onOpenKycMember}
        onOpenLoan={onOpenLoan}
        onOpenNotificationCategory={onOpenNotificationCategory}
        onOpenSupportChat={onOpenSupportChat}
      />

        <DashboardGrid>
          <DashboardTableCard
            title="Employee Performance"
            description="Top branch staff with simplified score and queue visibility."
            headers={['Employee', 'Loans', 'Tasks', 'Score', 'Action']}
            rows={
              visibleEmployees.length > 0
                ? visibleEmployees.map((item) => [
                    item.name,
                    item.loansHandled.toLocaleString(),
                    item.pendingTasks.toLocaleString(),
                    `${item.score}`,
                    item.status === 'needs_support' ? 'Coach' : 'Review',
                  ])
                : [['No employee performance yet', '-', '-', '-', '-']]
            }
        />

        <DashboardSectionCard
          title="Queue Alerts"
          description="Staff needing support before the backlog grows further."
        >
          {watchlist.length > 0 ? (
            <div className="dashboard-stack">
              {watchlist.slice(0, 4).map((item) => (
                <DashboardProgressRow
                  key={item.entityId}
                  label={item.name}
                  value={`${item.pendingTasks} pending`}
                  progress={Math.min(
                    Math.round((item.pendingTasks / Math.max(item.pendingTasks + item.loansEscalated, 1)) * 100),
                    100,
                  )}
                  tone={item.status === 'needs_support' ? 'red' : 'amber'}
                />
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title="No active employee alerts"
              description="Branch staffing pressure is currently under control."
            />
          )}
        </DashboardSectionCard>
      </DashboardGrid>

      <DashboardGrid>
        <LoanWorkflowWatchlistPanel
          title="Loan Workflow Watchlist"
          description="Branch-scoped loan cases that need correction follow-up, escalation, or approval attention."
          emptyActionLabel="Continue branch review"
          onOpenLoan={onOpenLoan}
        />

        <SupportWatchlistPanel
          title="Support Watchlist"
          description="Branch-scoped support chats with unread, escalated, or high-priority signals."
          onOpenChat={onOpenSupportChat}
        />
      </DashboardGrid>

      <DashboardGrid>
        <NotificationWatchlistPanel
          title="Notification Watchlist"
          description="Branch-scoped reminder work, delivery failures, and insurance alert signals."
          onOpenCategory={onOpenNotificationCategory}
        />

        <AutopayOperationsPanel
          role={session.role}
          title="AutoPay Operations"
          description="Branch-scoped standing instructions that need monitoring, re-enable follow-up, or reminder support."
          onOpenCategory={onOpenNotificationCategory}
          onOpenOperation={onOpenAutopayOperation}
        />
      </DashboardGrid>

      <DashboardGrid>
        <KycWatchlistPanel
          role={session.role}
          title="KYC Watchlist"
          description="Branch-scoped onboarding review cases that need review, correction, or approval."
          onOpenMember={onOpenKycMember}
        />
      </DashboardGrid>

      <DashboardGrid>
        <DashboardTableCard
          title="Top Employees"
          description="Best-performing staff members in the branch."
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
              : visibleEmployees.length > 0
                ? visibleEmployees.slice(0, 6).map((item) => [
                    item.name,
                    item.kycCompleted.toLocaleString(),
                    item.supportResolved.toLocaleString(),
                    item.transactionsProcessed.toLocaleString(),
                    item.score.toLocaleString(),
                  ])
                : [['No employee performance yet', '-', '-', '-', '-']]
          }
        />

        <DashboardTableCard
          title="Employees Needing Support"
          description="Compact watchlist for supervisor review."
          headers={['Employee', 'Pending', 'Escalated', 'Response', 'Action']}
          rows={
            watchlist.length > 0
              ? watchlist.map((item) => [
                  item.name,
                  item.pendingTasks.toLocaleString(),
                  item.loansEscalated.toLocaleString(),
                  `${item.responseTimeMinutes} min`,
                  item.status === 'needs_support'
                    ? 'Assign review'
                    : 'Coach',
                ])
              : [['No employee watchlist', '-', '-', '-', '-']]
          }
        />
        </DashboardGrid>
      </div>
    </DashboardPage>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
