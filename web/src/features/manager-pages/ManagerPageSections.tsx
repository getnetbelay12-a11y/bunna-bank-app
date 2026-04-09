import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  AuditLogItem,
  InsuranceAlertItem,
  LoanQueueItem,
  NotificationCategory,
  NotificationCampaignItem,
  NotificationCenterItem,
  OnboardingReviewItem,
  PerformanceSummaryItem,
  RolePerformanceItem,
  RolePerformanceOverview,
  StaffRankingItem,
  SupportChatSummaryItem,
} from '../../core/api/contracts';
import { getManagerConsoleKind, type AdminSession } from '../../core/session';
import {
  DashboardGrid,
  DashboardMetricRow,
  DashboardMiniBars,
  DashboardPage,
  DashboardProgressRow,
  DashboardSectionCard,
  DashboardTableCard,
  EmptyStateCard,
} from '../../shared/components/BankingDashboard';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type SessionProps = {
  session: AdminSession;
};

export function MembersPage({ session }: SessionProps) {
  const { dashboardApi } = useAppClient();
  const [branches, setBranches] = useState<PerformanceSummaryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getBranchPerformance(session.role).then((result) => {
      if (!cancelled) {
        setBranches(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  const totalMembers = branches.reduce((sum, item) => sum + item.customersServed, 0);
  const totalTransactions = branches.reduce((sum, item) => sum + item.transactionsCount, 0);
  const totalSchoolPayments = branches.reduce((sum, item) => sum + item.schoolPaymentsCount, 0);
  const topScope =
    [...branches].sort((left, right) => right.customersServed - left.customersServed)[0] ?? null;

  return (
    <DashboardPage>
      <div className="members-page">
        <DashboardGrid>
          <DashboardSectionCard
            title="Membership Snapshot"
            description="Membership growth, branch coverage, and service readiness within the current role scope."
          >
            <div className="dashboard-stack">
              <DashboardMetricRow label="Members served" value={totalMembers.toLocaleString()} />
              <DashboardMetricRow label="Transactions" value={totalTransactions.toLocaleString()} />
              <DashboardMetricRow label="School payments" value={totalSchoolPayments.toLocaleString()} />
              <DashboardMetricRow
                label="Top scope"
                value={topScope ? topScope.customersServed.toLocaleString() : 'Not available'}
                note={topScope ? titleCase(topScope.scopeId) : 'No scope data yet'}
              />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Scope Activity"
            description="Customer footprint across the visible coverage area."
          >
            {branches.length > 0 ? (
              <DashboardMiniBars
                items={branches.slice(0, 6).map((item) => ({
                  label: titleCase(item.scopeId),
                  value: item.customersServed,
                  tone: 'blue' as const,
                }))}
              />
            ) : (
              <EmptyStateCard
                title="No membership activity yet"
                description="Coverage and member activity will appear here when scope data is available."
              />
            )}
          </DashboardSectionCard>
        </DashboardGrid>

        <DashboardTableCard
          title="Membership Coverage"
          description="Customer service totals across the current management scope."
          headers={['Scope', 'Members', 'Transactions', 'School Payments', 'Volume']}
          rows={
            branches.length > 0
              ? branches.map((item) => [
                  titleCase(item.scopeId),
                  item.customersServed.toLocaleString(),
                  item.transactionsCount.toLocaleString(),
                  item.schoolPaymentsCount.toLocaleString(),
                  `ETB ${item.totalTransactionAmount.toLocaleString()}`,
                ])
              : [['No membership data yet', '-', '-', '-', '-']]
          }
        />
      </div>
    </DashboardPage>
  );
}

export function KycVerificationPage({
  session,
  initialMemberId,
  returnContextLabel,
  onReturnToContext,
}: SessionProps & {
  initialMemberId?: string;
  returnContextLabel?: string;
  onReturnToContext?: () => void;
}) {
  const { dashboardApi } = useAppClient();
  const [items, setItems] = useState<OnboardingReviewItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getOnboardingReviewQueue(session.role).then((result) => {
      if (!cancelled) {
        setItems(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  const counts = {
    submitted: items.filter((item) => item.onboardingReviewStatus === 'submitted').length,
    reviewInProgress: items.filter((item) => item.onboardingReviewStatus === 'review_in_progress').length,
    needsAction: items.filter((item) => item.onboardingReviewStatus === 'needs_action').length,
  };
  const prioritizedItems =
    initialMemberId && items.some((item) => item.memberId === initialMemberId)
      ? [
          ...items.filter((item) => item.memberId === initialMemberId),
          ...items.filter((item) => item.memberId !== initialMemberId),
        ]
      : items;

  const handleReviewAction = async (
    memberId: string,
    status: 'review_in_progress' | 'needs_action' | 'approved',
  ) => {
    const note =
      status === 'needs_action'
        ? 'Staff marked this onboarding package for customer correction.'
        : status === 'approved'
          ? 'Staff approved onboarding after Fayda and selfie review.'
          : 'Staff moved this onboarding package into active review.';

    const updated = await dashboardApi.updateOnboardingReview(memberId, {
      status,
      note,
    });

    setItems((current) =>
      current.map((item) => (item.memberId === memberId ? updated : item)),
    );
  };

  return (
    <DashboardPage>
      {returnContextLabel && onReturnToContext ? (
        <div className="loan-return-banner">
          <div>
            <p className="eyebrow">Dashboard Context</p>
            <strong>Opened from {returnContextLabel}</strong>
          </div>
          <button
            type="button"
            className="loan-return-button"
            onClick={onReturnToContext}
          >
            Back to {returnContextLabel}
          </button>
        </div>
      ) : null}
      <div className="kyc-page">
        <DashboardGrid>
          <DashboardSectionCard
            title="KYC Verification"
            description="Live onboarding review queue with secure status handling, exception follow-up, and approval readiness."
          >
            <div className="dashboard-stack">
              <DashboardMetricRow label="Submitted" value={counts.submitted.toString()} />
              <DashboardMetricRow label="In active review" value={counts.reviewInProgress.toString()} />
              <DashboardMetricRow label="Needs customer action" value={counts.needsAction.toString()} />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="KYC Queue Trend"
            description="Current posture across submitted, in-review, and correction cases."
          >
            <DashboardMiniBars
              items={[
                { label: 'Submitted', value: counts.submitted, tone: 'blue' },
                { label: 'Review', value: counts.reviewInProgress, tone: 'amber' },
                { label: 'Needs action', value: counts.needsAction, tone: 'red' },
              ]}
            />
          </DashboardSectionCard>
        </DashboardGrid>

        <DashboardTableCard
          title="Onboarding Review Queue"
          description="Branch and district teams can move cases into review, request correction, or approve verified onboarding packages."
          headers={[
            'Customer',
            'Branch',
            'Review stage',
            'Identity state',
            'Customer next step',
            'Review action',
          ]}
          rows={
            prioritizedItems.length > 0
              ? prioritizedItems.map((item) => [
                  `${item.memberName} (${item.customerId})`,
                  item.branchName ?? 'Unassigned',
                  item.onboardingReviewStatus.replace(/_/g, ' '),
                  `${item.identityVerificationStatus} / ${item.kycStatus}`,
                  item.requiredAction,
                  <div key={item.memberId} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => void handleReviewAction(item.memberId, 'review_in_progress')}
                    >
                      Start review
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => void handleReviewAction(item.memberId, 'needs_action')}
                    >
                      Request update
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void handleReviewAction(item.memberId, 'approved')}
                    >
                      Approve
                    </button>
                  </div>,
                ])
              : [['No onboarding reviews', '-', '-', '-', '-', '-']]
          }
        />
      </div>
    </DashboardPage>
  );
}

export function ReportsHubPage({ session }: SessionProps) {
  const { dashboardApi } = useAppClient();
  const [summary, setSummary] = useState<PerformanceSummaryItem[]>([]);
  const [staff, setStaff] = useState<StaffRankingItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const kind = getManagerConsoleKind(session.role);
    const summaryPromise =
      kind === 'district'
        ? dashboardApi.getBranchPerformance(session.role)
        : kind === 'head_office'
          ? dashboardApi.getDistrictPerformance(session.role)
          : dashboardApi.getBranchPerformance(session.role);

    void Promise.all([summaryPromise, dashboardApi.getStaffRanking(session.role)]).then(
      ([summaryResult, staffResult]) => {
        if (cancelled) {
          return;
        }

        setSummary(summaryResult);
        setStaff(staffResult);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  const totalMembers = summary.reduce((sum, item) => sum + item.customersServed, 0);
  const totalTransactions = summary.reduce((sum, item) => sum + item.transactionsCount, 0);
  const totalVolume = summary.reduce((sum, item) => sum + item.totalTransactionAmount, 0);
  const totalSchoolPayments = summary.reduce((sum, item) => sum + item.schoolPaymentsCount, 0);
  const totalLoanApprovals = summary.reduce((sum, item) => sum + item.loanApprovedCount, 0);
  const totalLoanRejections = summary.reduce((sum, item) => sum + item.loanRejectedCount, 0);
  const reportBars = summary.slice(0, 6).map((item) => ({
    label: titleCase(item.scopeId),
    value: item.transactionsCount,
    tone: 'blue' as const,
  }));
  const volumeBars = summary.slice(0, 6).map((item) => ({
    label: titleCase(item.scopeId),
    value: item.totalTransactionAmount,
    tone: 'teal' as const,
  }));
  const scopeLabel =
    getManagerConsoleKind(session.role) === 'head_office'
      ? 'District'
      : getManagerConsoleKind(session.role) === 'district'
        ? 'Branch'
        : 'Branch';
  const topScope =
    [...summary].sort((left, right) => right.transactionsCount - left.transactionsCount)[0] ?? null;
  const watchScope =
    [...summary].sort((left, right) => left.loanApprovedCount - right.loanApprovedCount)[0] ?? null;

  return (
    <DashboardPage>
      <div className="reports-page">
        <DashboardGrid>
          <DashboardSectionCard
            title="Reporting Snapshot"
            description={`Scheduled and export-ready reporting for ${session.branchName}.`}
          >
            <div className="dashboard-stack">
              <DashboardMetricRow label="Members served" value={totalMembers.toLocaleString()} />
              <DashboardMetricRow label="Transactions" value={totalTransactions.toLocaleString()} />
              <DashboardMetricRow label="Volume" value={`ETB ${totalVolume.toLocaleString()}`} />
              <DashboardMetricRow label="School payments" value={totalSchoolPayments.toLocaleString()} />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Activity Trend"
            description="Visible scope activity by branch or district."
          >
            {reportBars.length > 0 ? (
              <DashboardMiniBars items={reportBars} />
            ) : (
              <EmptyStateCard
                title="No activity data yet"
                description="Reporting trends will appear once operational performance data is available in this scope."
              />
            )}
          </DashboardSectionCard>
        </DashboardGrid>

        <DashboardGrid>
          <DashboardSectionCard
            title="Reporting Focus"
            description="Quick reading on the strongest and weakest visible reporting areas."
          >
            <div className="dashboard-stack">
              <DashboardMetricRow
                label={`Top ${scopeLabel.toLowerCase()}`}
                value={topScope ? topScope.transactionsCount.toLocaleString() : 'Not available'}
                note={topScope ? titleCase(topScope.scopeId) : 'No reporting activity yet'}
              />
              <DashboardMetricRow
                label="Loan approvals"
                value={totalLoanApprovals.toLocaleString()}
                note="Confirmed across the visible reporting scope"
              />
              <DashboardMetricRow
                label="Rejected or returned"
                value={totalLoanRejections.toLocaleString()}
                note="Cases needing follow-up in reporting review"
              />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Exceptions to Review"
            description="Scopes that need reporting attention before the next export cycle."
          >
            {watchScope ? (
              <div className="dashboard-stack">
                <DashboardProgressRow
                  label={titleCase(watchScope.scopeId)}
                  value={`${watchScope.loanRejectedCount.toLocaleString()} rejected`}
                  progress={Math.max(15, Math.min(watchScope.loanApprovedCount * 10, 100))}
                  tone={watchScope.loanRejectedCount > 0 ? 'amber' : 'green'}
                />
                <DashboardMetricRow
                  label="Pending report focus"
                  value={watchScope.schoolPaymentsCount.toLocaleString()}
                  note="School-payment items in the visible reporting mix"
                />
              </div>
            ) : (
              <EmptyStateCard
                title="No reporting exceptions"
                description="Reporting exceptions will appear here when scope data arrives."
              />
            )}
          </DashboardSectionCard>
        </DashboardGrid>

        <DashboardTableCard
          title="Scheduled Reports"
          description="Current export and reporting cadence."
          headers={['Report', 'Scope', 'Refresh', 'Status']}
          rows={[
            ['Executive summary', session.branchName, 'Hourly', 'Ready'],
            ['Loan approvals and escalations', session.branchName, 'Every 15 min', 'Live'],
            ['Member growth and service load', session.branchName, 'Daily', 'Ready'],
            ['School payment activity', session.branchName, 'Daily', 'Ready'],
          ]}
        />

        <DashboardGrid>
          <DashboardSectionCard
            title="Volume Mix"
            description="Transaction volume concentration across the visible reporting scope."
          >
            {volumeBars.length > 0 ? (
              <DashboardMiniBars items={volumeBars} />
            ) : (
              <EmptyStateCard
                title="No volume mix yet"
                description="Volume mix will appear once transaction totals are available."
              />
            )}
          </DashboardSectionCard>

          <DashboardTableCard
            title={`${scopeLabel} Activity`}
            description="Operational totals in the current reporting scope."
            headers={[scopeLabel, 'Members', 'Transactions', 'School Payments', 'Volume']}
            rows={
              summary.length > 0
                ? summary.map((item) => [
                    titleCase(item.scopeId),
                    item.customersServed.toLocaleString(),
                    item.transactionsCount.toLocaleString(),
                    item.schoolPaymentsCount.toLocaleString(),
                    `ETB ${item.totalTransactionAmount.toLocaleString()}`,
                  ])
                : [['No reporting activity yet', '-', '-', '-', '-']]
            }
          />

          <DashboardTableCard
            title="Staff Output"
            description="Top available staff reporting signals in this scope."
            headers={['Staff', 'Customers', 'Transactions', 'Loans', 'Score']}
            rows={
              staff.length > 0
                ? staff.slice(0, 6).map((item) => [
                    titleCase(item.staffId),
                    item.customersServed.toLocaleString(),
                    item.transactionsCount.toLocaleString(),
                    item.loanApprovedCount.toLocaleString(),
                    item.score.toLocaleString(),
                  ])
                : [['No staff reporting data', '-', '-', '-', '-']]
            }
          />
        </DashboardGrid>
      </div>
    </DashboardPage>
  );
}

export function BranchOverviewPage({ session }: SessionProps) {
  const { dashboardApi } = useAppClient();
  const [branches, setBranches] = useState<PerformanceSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getBranchPerformance(session.role).then((result) => {
      if (!cancelled) {
        setBranches(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  const rankedBranches = [...branches]
    .map((item) => ({
      item,
      score: calculatePerformanceScore(item),
    }))
    .sort((left, right) => right.score - left.score);
  const topBranch = rankedBranches[0] ?? null;
  const totalMembers = branches.reduce((sum, item) => sum + item.customersServed, 0);
  const totalTransactions = branches.reduce((sum, item) => sum + item.transactionsCount, 0);
  const totalVolume = branches.reduce((sum, item) => sum + item.totalTransactionAmount, 0);
  const totalApprovals = branches.reduce((sum, item) => sum + item.loanApprovedCount, 0);
  const totalRejections = branches.reduce((sum, item) => sum + item.loanRejectedCount, 0);
  const totalSchoolPayments = branches.reduce((sum, item) => sum + item.schoolPaymentsCount, 0);
  const watchlistBranches = rankedBranches.filter((item) => item.score < 70).length;

  return (
    <DashboardPage>
      <div className="district-branch-page">
        <section className="district-branch-summary">
          <DashboardSectionCard
            title="District Branch Snapshot"
            description="Branch comparison for district leadership."
          >
            <div className="dashboard-stack">
              <DashboardMetricRow
                label="Branches in scope"
                value={branches.length.toLocaleString()}
                note={loading ? 'Loading district branch view' : 'Active district branch comparison'}
              />
              <DashboardMetricRow
                label="Top branch"
                value={topBranch ? `${topBranch.score} score` : 'Not available'}
                note={
                  topBranch
                    ? formatScopeLabel(topBranch.item.scopeId)
                    : 'No ranked branch data yet'
                }
              />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="District Totals"
            description="Rolled-up branch activity in the current scope."
          >
            <div className="dashboard-stack">
              <DashboardMetricRow
                label="Members served"
                value={totalMembers.toLocaleString()}
              />
              <DashboardMetricRow
                label="Transactions"
                value={totalTransactions.toLocaleString()}
              />
              <DashboardMetricRow
                label="Volume"
                value={`ETB ${totalVolume.toLocaleString()}`}
              />
              <DashboardMetricRow
                label="Loan approvals"
                value={totalApprovals.toLocaleString()}
                note={`${totalRejections.toLocaleString()} declined across the district`}
              />
              <DashboardMetricRow
                label="School collections"
                value={totalSchoolPayments.toLocaleString()}
                note={`${watchlistBranches.toLocaleString()} branches need coaching`}
              />
            </div>
          </DashboardSectionCard>
        </section>

        <DashboardGrid>
          <DashboardSectionCard
            title="Scoreboard"
            description="Branch execution scores across the district."
          >
            {rankedBranches.length > 0 ? (
              <div className="dashboard-stack">
                {rankedBranches.slice(0, 6).map((item) => (
                  <DashboardProgressRow
                    key={item.item.scopeId}
                    label={formatScopeLabel(item.item.scopeId)}
                    value={`${item.score} score · ${item.item.loanApprovedCount.toLocaleString()} approvals`}
                    progress={Math.min(item.score, 100)}
                    tone={item.score >= 85 ? 'green' : item.score >= 70 ? 'blue' : 'amber'}
                  />
                ))}
              </div>
            ) : (
              <EmptyStateCard
                title={loading ? 'Loading branch performance' : 'No branch performance data'}
                description={
                  loading
                    ? 'District branch metrics are loading now.'
                    : 'There is no branch performance data in the current district scope yet.'
                }
              />
            )}
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Branch Watchlist"
            description="Lower-scoring branches that need district coaching."
          >
            {rankedBranches.length > 0 ? (
              <div className="dashboard-stack">
                {rankedBranches
                  .slice()
                  .sort((left, right) => left.score - right.score)
                  .slice(0, 4)
                  .map((item) => (
                    <DashboardProgressRow
                      key={item.item.scopeId}
                      label={formatScopeLabel(item.item.scopeId)}
                      value={`${item.item.loanRejectedCount.toLocaleString()} declined · ${item.item.schoolPaymentsCount.toLocaleString()} school payments`}
                      progress={Math.min(item.score, 100)}
                      tone={item.score < 70 ? 'red' : 'amber'}
                    />
                  ))}
              </div>
            ) : (
              <EmptyStateCard
                title="No branch watchlist"
                description="District branch watchlist items will appear here when branch metrics are available."
              />
            )}
          </DashboardSectionCard>
        </DashboardGrid>

        <DashboardTableCard
          title="Branch Performance"
          description="District branch performance with collection, lending, and operational detail."
          headers={[
            'Branch',
            'Members',
            'Transactions',
            'Approvals',
            'Declined',
            'School Payments',
            'Volume',
            'Score',
            'Health',
          ]}
          rows={
            rankedBranches.length > 0
              ? rankedBranches.map((item) => [
                  formatScopeLabel(item.item.scopeId),
                  item.item.customersServed.toLocaleString(),
                  item.item.transactionsCount.toLocaleString(),
                  item.item.loanApprovedCount.toLocaleString(),
                  item.item.loanRejectedCount.toLocaleString(),
                  item.item.schoolPaymentsCount.toLocaleString(),
                  `ETB ${item.item.totalTransactionAmount.toLocaleString()}`,
                  `${item.score}`,
                  describeBranchHealth(item.score, item.item),
                ])
              : [[loading ? 'Loading branch data' : 'No branches found', '-', '-', '-', '-', '-', '-', '-', '-']]
          }
        />
      </div>
    </DashboardPage>
  );
}

function calculatePerformanceScore(item: PerformanceSummaryItem) {
  const memberBand = Math.min(Math.round(item.customersServed / 12), 25);
  const transactionBand = Math.min(Math.round(item.transactionsCount / 28), 25);
  const approvalBand = Math.min(item.loanApprovedCount * 6, 30);
  const paymentBand = Math.min(item.schoolPaymentsCount * 4, 20);

  return Math.min(memberBand + transactionBand + approvalBand + paymentBand, 100);
}

export function KycAuditPage({ session }: SessionProps) {
  const { dashboardApi } = useAppClient();
  const [districts, setDistricts] = useState<PerformanceSummaryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getDistrictPerformance(session.role).then((result) => {
      if (!cancelled) {
        setDistricts(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  return (
    <div className="page-stack">
      <Panel
        title="KYC Audits"
        description="District verification exceptions and audit follow-up."
      >
        <p className="muted">
          Manual review and audit queues should be closed before districts push customers
          into sensitive services such as governance participation or account security changes.
        </p>
        <SimpleTable
          headers={['District', 'Pending Audits', 'Manual Reviews', 'Escalations', 'Action']}
          rows={
            districts.length > 0
              ? districts.map((item) => [
                  titleCase(item.scopeId),
                  Math.max(2, Math.round(item.customersServed * 0.02)).toLocaleString(),
                  Math.max(1, Math.round(item.loanRejectedCount * 0.4)).toLocaleString(),
                  Math.max(1, Math.round(item.loanRejectedCount * 0.25)).toLocaleString(),
                  item.loanRejectedCount > 0 ? 'Audit branch evidence' : 'Monitor only',
                ])
              : [['Loading', '...', '...', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

export function AlertsPage({ session }: SessionProps) {
  return (
    <div className="page-stack">
      <Panel
        title="Loan Escalations"
        description={`Escalated loan reviews and follow-up items for ${session.branchName}.`}
      >
        <SimpleTable
          headers={['Priority', 'Loan Stage', 'Owner']}
          rows={[
            ['Critical', 'District review queue exceeded target', 'District credit desk'],
            ['High', 'Head office approval pending documents', 'Loan operations lead'],
            ['Medium', 'Customer document follow-up needed', 'Branch loan officer'],
          ]}
        />
      </Panel>
    </div>
  );
}

export function RiskMonitoringPage({
  session,
  onOpenLoan,
  onOpenKycMember,
  onOpenSupportChat,
  onOpenAuditEntity,
  onOpenNotificationCategory,
}: SessionProps & {
  onOpenLoan?: (loanId: string) => void;
  onOpenKycMember?: (memberId: string) => void;
  onOpenSupportChat?: (conversationId: string) => void;
  onOpenAuditEntity?: (entity: string) => void;
  onOpenNotificationCategory?: (category: NotificationCategory) => void;
}) {
  const { auditApi, dashboardApi, loanMonitoringApi, notificationApi, supportApi } = useAppClient();
  const scope = session.branchName === 'Head Office' ? 'institution' : session.branchName;
  const [kycItems, setKycItems] = useState<OnboardingReviewItem[]>([]);
  const [loanItems, setLoanItems] = useState<LoanQueueItem[]>([]);
  const [supportItems, setSupportItems] = useState<SupportChatSummaryItem[]>([]);
  const [auditItems, setAuditItems] = useState<AuditLogItem[]>([]);
  const [campaignItems, setCampaignItems] = useState<NotificationCampaignItem[]>([]);
  const [insuranceAlerts, setInsuranceAlerts] = useState<InsuranceAlertItem[]>([]);
  const [activeRiskFilter, setActiveRiskFilter] = useState<
    'all' | 'Critical' | 'Watch' | 'Healthy' | 'actionable'
  >('all');

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      dashboardApi.getOnboardingReviewQueue(session.role),
      loanMonitoringApi?.getPendingLoans() ?? Promise.resolve([]),
      Promise.all([
        supportApi.getOpenChats(),
        supportApi.getAssignedChats(),
        supportApi.getResolvedChats(),
      ]),
      auditApi.getByEntity(session.role),
      notificationApi.getCampaigns(),
      notificationApi.getInsuranceAlerts(),
    ]).then(([
      onboardingResult,
      loanResult,
      supportResult,
      auditResult,
      campaignResult,
      insuranceAlertResult,
    ]) => {
      if (cancelled) {
        return;
      }

      setKycItems(onboardingResult);
      setLoanItems(loanResult);
      setSupportItems([...supportResult[0], ...supportResult[1], ...supportResult[2]]);
      setAuditItems(auditResult);
      setCampaignItems(campaignResult);
      setInsuranceAlerts(insuranceAlertResult);
    });

    return () => {
      cancelled = true;
    };
  }, [auditApi, dashboardApi, loanMonitoringApi, notificationApi, session.role, supportApi]);

  const riskSignals = buildRiskSignals({
    auditItems,
    campaignItems,
    insuranceAlerts,
    kycItems,
    loanItems,
    supportItems,
  });
  const actionableSignals = riskSignals.filter(isActionableRiskSignal);
  const filteredRiskSignals =
    activeRiskFilter === 'all'
      ? riskSignals
      : activeRiskFilter === 'actionable'
        ? actionableSignals
        : riskSignals.filter((item) => item.status === activeRiskFilter);
  const topActionableRiskSignal = filteredRiskSignals.find(
    (item) => item.status !== 'Healthy' && isActionableRiskSignal(item),
  );
  const criticalSignals = riskSignals.filter((item) => item.status === 'Critical').length;
  const watchSignals = riskSignals.filter((item) => item.status === 'Watch').length;
  const healthySignals = riskSignals.filter((item) => item.status === 'Healthy').length;
  const filteredCriticalSignals = filteredRiskSignals.filter(
    (item) => item.status === 'Critical',
  ).length;
  const filteredWatchSignals = filteredRiskSignals.filter((item) => item.status === 'Watch').length;
  const filteredLoanSignals = filteredRiskSignals.filter((item) => item.area.includes('Loan')).length;
  const filteredCustomerSignals = filteredRiskSignals.filter(
    (item) => item.area.includes('KYC') || item.area.includes('Support'),
  ).length;
  const filteredActionableSignals = filteredRiskSignals.filter(isActionableRiskSignal).length;

  return (
    <div className="page-stack">
      <Panel
        title="Risk Monitoring"
        description={`Risk visibility for ${scope}, focused on loan processing, document gaps, and service escalations.`}
      >
        <p className="muted">
          This queue uses live operational signals from loan workflow, onboarding review,
          support operations, and audit activity instead of static placeholder counts.
        </p>
        <div className="dashboard-summary-strip">
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Active risk view</span>
            <strong>
              {activeRiskFilter === 'all'
                ? `All (${filteredRiskSignals.length})`
                : activeRiskFilter === 'actionable'
                  ? `Actionable Only (${filteredRiskSignals.length})`
                : `${activeRiskFilter} (${filteredRiskSignals.length})`}
            </strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Critical signals</span>
            <strong>{filteredCriticalSignals.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Watch signals</span>
            <strong>{filteredWatchSignals.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Loan risk items</span>
            <strong>{filteredLoanSignals.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Customer service items</span>
            <strong>{filteredCustomerSignals.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Actionable items</span>
            <strong>{filteredActionableSignals.toLocaleString()}</strong>
          </div>
        </div>
        <div className="loan-filter-row">
          {[
            { id: 'all', label: `All (${riskSignals.length})` },
            { id: 'Critical', label: `Critical (${criticalSignals})` },
            { id: 'Watch', label: `Watch (${watchSignals})` },
            { id: 'actionable', label: `Actionable Only (${actionableSignals.length})` },
            {
              id: 'Healthy',
              label: `Healthy (${healthySignals})`,
            },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={
                activeRiskFilter === filter.id ? 'loan-filter-chip active' : 'loan-filter-chip'
              }
              onClick={() =>
                setActiveRiskFilter(
                  filter.id as 'all' | 'Critical' | 'Watch' | 'Healthy' | 'actionable',
                )
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
        {topActionableRiskSignal ? (
          <div className="loan-summary-strip">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                openRiskSignal(topActionableRiskSignal, {
                  onOpenAuditEntity,
                  onOpenKycMember,
                  onOpenLoan,
                  onOpenNotificationCategory,
                  onOpenSupportChat,
                })
              }
            >
              Open top urgent risk
            </button>
          </div>
        ) : null}
        <SimpleTable
          headers={['Priority', 'Risk area', 'Current signal', 'Status', 'Actionable', 'Recommended next step', 'Open workspace']}
          rows={filteredRiskSignals.map((item) => [
            formatRiskPriority(item.priority, item.status),
            item.area,
            item.signal,
            item.status,
            isActionableRiskSignal(item) ? 'Yes' : 'No',
            item.action,
            renderRiskActionCell(item, {
              onOpenAuditEntity,
              onOpenKycMember,
              onOpenLoan,
              onOpenNotificationCategory,
              onOpenSupportChat,
            }),
          ])}
          emptyState={{
            title: 'No risk items in this view',
            description:
              activeRiskFilter === 'all'
                ? 'There are no current operational risk signals for this scope.'
                : `There are no ${activeRiskFilter.toLowerCase()} risk signals for this scope.`,
          }}
        />
      </Panel>
    </div>
  );
}

export function SupportAnalyticsPage() {
  return (
    <div className="page-stack">
      <Panel
        title="Support Analytics"
        description="Institution-wide support volume, backlog, and escalation patterns."
      >
        <SimpleTable
          headers={['Metric', 'Current Value', 'Status']}
          rows={[
            ['Open support issues', '38', 'Watch'],
            ['Assigned chats', '24', 'Healthy'],
            ['Escalated support cases', '7', 'Needs review'],
            ['Average first response time', '4m 12s', 'On target'],
          ]}
        />
      </Panel>
    </div>
  );
}

export function NotificationsPage({ session }: SessionProps) {
  const { notificationApi } = useAppClient();
  const [items, setItems] = useState<NotificationCenterItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void notificationApi.getNotifications(session.role).then((result) => {
      if (!cancelled) {
        setItems(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [notificationApi, session.role]);

  const sentCount = items.filter((item) => item.status === 'sent').length;
  const failedCount = items.filter((item) => item.status === 'failed').length;
  const unreadCount = items.filter((item) => item.status === 'unread').length;
  const typeCounts = new Map<string, number>();
  items.forEach((item) => {
    typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1);
  });

  return (
    <DashboardPage>
      <div className="notifications-page-workspace">
        <DashboardGrid>
          <DashboardSectionCard
            title="Notification Snapshot"
            description="Operational broadcasts and event notifications in the current scope."
          >
            <div className="dashboard-stack">
              <DashboardMetricRow label="Sent" value={sentCount.toLocaleString()} />
              <DashboardMetricRow label="Unread" value={unreadCount.toLocaleString()} />
              <DashboardMetricRow label="Failed" value={failedCount.toLocaleString()} />
              <DashboardMetricRow
                label="Latest activity"
                value={items[0] ? titleCase(items[0].type) : 'Not available'}
                note={items[0]?.sentAt ?? 'No notifications yet'}
              />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Category Mix"
            description="Visible notification categories in this scope."
          >
            {items.length > 0 ? (
              <DashboardMiniBars
                items={Array.from(typeCounts.entries()).slice(0, 6).map(([label, value]) => ({
                  label: titleCase(label),
                  value,
                  tone: 'blue' as const,
                }))}
              />
            ) : (
              <EmptyStateCard
                title="No notification activity"
                description="Notification categories will appear here when operational messages are sent."
              />
            )}
          </DashboardSectionCard>
        </DashboardGrid>

        <DashboardTableCard
          title="Notifications"
          description="Current operational broadcasts and event notifications."
          headers={['Type', 'User', 'Status', 'Sent At']}
          rows={
            items.length > 0
              ? items.map((item) => [
                  titleCase(item.type),
                  item.userLabel,
                  titleCase(item.status),
                  item.sentAt,
                ])
              : [['No notifications yet', '-', '-', '-']]
          }
        />
      </div>
    </DashboardPage>
  );
}

export function StaffSnapshotPage({ session }: SessionProps) {
  const { dashboardApi } = useAppClient();
  const [staff, setStaff] = useState<StaffRankingItem[]>([]);
  const [overview, setOverview] = useState<RolePerformanceOverview | null>(null);
  const [topEmployees, setTopEmployees] = useState<RolePerformanceItem[]>([]);
  const [watchlist, setWatchlist] = useState<RolePerformanceItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      dashboardApi.getStaffRanking(session.role),
      dashboardApi.getBranchEmployeeSummary(session.role),
      dashboardApi.getBranchTopEmployees(session.role),
      dashboardApi.getBranchEmployeeWatchlist(session.role),
    ]).then(([staffResult, overviewResult, topResult, watchlistResult]) => {
      if (!cancelled) {
        setStaff(staffResult);
        setOverview(overviewResult);
        setTopEmployees(topResult);
        setWatchlist(watchlistResult);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  const topPerformer = topEmployees[0] ?? null;
  const totalCustomers = staff.reduce((sum, item) => sum + item.customersServed, 0);
  const totalTransactions = staff.reduce((sum, item) => sum + item.transactionsCount, 0);
  const fallbackRows =
    overview?.items.map((item) => ({
      staffId: item.entityId,
      customersServed: item.customersHelped,
      transactionsCount: item.transactionsProcessed,
      loanApprovedCount: item.loansApproved,
      schoolPaymentsCount: 0,
      score: item.score,
      label: item.name,
    })) ?? [];
  const staffRows =
    staff.length > 0
      ? staff.map((item) => ({
          ...item,
          label: titleCase(item.staffId),
        }))
      : fallbackRows;
  const scoreRows =
    topEmployees.length > 0
      ? topEmployees.slice(0, 5).map((item) => ({
          key: item.entityId,
          label: item.name,
          score: item.score,
          note: `${item.pendingTasks} pending`,
          tone: item.score >= 85 ? 'green' as const : item.score >= 70 ? 'blue' as const : 'amber' as const,
        }))
      : staffRows.slice(0, 5).map((item) => ({
          key: item.staffId,
          label: item.label,
          score: item.score,
          note: `${item.loanApprovedCount.toLocaleString()} loans`,
          tone: item.score >= 85 ? 'green' as const : item.score >= 70 ? 'blue' as const : 'amber' as const,
        }));
  const watchRows =
    watchlist.length > 0
      ? watchlist.slice(0, 4).map((item) => ({
          key: item.entityId,
          label: item.name,
          value: `${item.pendingTasks} pending`,
          progress: Math.min(
            Math.round((item.pendingTasks / Math.max(item.pendingTasks + item.loansEscalated, 1)) * 100),
            100,
          ),
          tone: item.status === 'needs_support' ? 'red' as const : 'amber' as const,
        }))
      : scoreRows
          .slice()
          .sort((left, right) => left.score - right.score)
          .slice(0, 3)
          .map((item) => ({
            key: item.key,
            label: item.label,
            value: item.note,
            progress: Math.max(20, Math.min(item.score, 100)),
            tone: item.score < 70 ? 'red' as const : 'amber' as const,
          }));

  return (
    <DashboardPage>
      <div className="staff-performance-page">
        <DashboardGrid>
          <DashboardSectionCard
            title="Staff Snapshot"
            description="Performance ranking for the currently visible management scope."
          >
            <div className="dashboard-stack">
              <DashboardMetricRow label="Tracked staff" value={staff.length.toLocaleString()} />
              <DashboardMetricRow label="Customers" value={totalCustomers.toLocaleString()} />
              <DashboardMetricRow label="Transactions" value={totalTransactions.toLocaleString()} />
              <DashboardMetricRow
                label="Top performer"
                value={topPerformer ? `${topPerformer.score} score` : 'Not available'}
                note={topPerformer?.name ?? 'No employee ranking yet'}
              />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Employee Scoreboard"
            description="Top staff score posture in the visible branch scope."
          >
            {scoreRows.length > 0 ? (
              <div className="dashboard-stack">
                {scoreRows.map((item) => (
                  <DashboardProgressRow
                    key={item.key}
                    label={item.label}
                    value={`${item.score} score`}
                    progress={Math.min(item.score, 100)}
                    tone={item.tone}
                  />
                ))}
              </div>
            ) : (
              <EmptyStateCard
                title="No staff score data"
                description="Employee score posture will appear here when branch employee performance data is available."
              />
            )}
          </DashboardSectionCard>
        </DashboardGrid>

        <DashboardGrid>
          <DashboardSectionCard
            title="Branch Workload"
            description="Operational branch employee totals for the selected scope."
          >
            <div className="dashboard-stack">
              <DashboardMetricRow
                label="Loans handled"
                value={overview?.kpis.loansHandled.toLocaleString() ?? '0'}
              />
              <DashboardMetricRow
                label="Pending tasks"
                value={overview?.kpis.pendingTasks.toLocaleString() ?? '0'}
              />
              <DashboardMetricRow
                label="Support resolved"
                value={overview?.kpis.supportResolved.toLocaleString() ?? '0'}
              />
              <DashboardMetricRow
                label="Avg handling"
                value={overview ? `${overview.kpis.avgHandlingTime} min` : 'Not available'}
              />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Employee Watchlist"
            description="Staff members needing manager attention."
          >
            {watchRows.length > 0 ? (
              <div className="dashboard-stack">
                {watchRows.map((item) => (
                  <DashboardProgressRow
                    key={item.key}
                    label={item.label}
                    value={item.value}
                    progress={item.progress}
                    tone={item.tone}
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

        <DashboardTableCard
          title="Staff Performance"
          description="Compact branch staff ranking."
          headers={['Staff', 'Customers', 'Transactions', 'Loans', 'Score']}
          rows={
            staffRows.length > 0
              ? staffRows.map((item) => [
                  item.label,
                  item.customersServed.toLocaleString(),
                  item.transactionsCount.toLocaleString(),
                  item.loanApprovedCount.toLocaleString(),
                  item.score.toLocaleString(),
                ])
              : [['No staff performance data', '-', '-', '-', '-']]
          }
        />
      </div>
    </DashboardPage>
  );
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatScopeLabel(value: string) {
  return titleCase(value.replace(/-/g, ' '));
}

function describeBranchHealth(score: number, item: PerformanceSummaryItem) {
  if (score >= 85) {
    return `Leading · ${item.loanApprovedCount.toLocaleString()} approvals`;
  }

  if (score >= 70) {
    return `Stable · ${item.transactionsCount.toLocaleString()} transactions`;
  }

  return `Watch · ${item.loanRejectedCount.toLocaleString()} declined cases`;
}

function buildRiskSignals({
  auditItems,
  campaignItems,
  insuranceAlerts,
  kycItems,
  loanItems,
  supportItems,
}: {
  auditItems: AuditLogItem[];
  campaignItems: NotificationCampaignItem[];
  insuranceAlerts: InsuranceAlertItem[];
  kycItems: OnboardingReviewItem[];
  loanItems: LoanQueueItem[];
  supportItems: SupportChatSummaryItem[];
}) {
  const highValueLoans = loanItems.filter((item) => item.amount >= 20000000);
  const correctionLoans = loanItems.filter((item) => item.deficiencyReasons.length > 0);
  const kycNeedsAction = kycItems.filter(
    (item) => item.onboardingReviewStatus === 'needs_action',
  );
  const kycInReview = kycItems.filter(
    (item) => item.onboardingReviewStatus === 'review_in_progress',
  );
  const escalatedSupport = supportItems.filter(
    (item) => item.escalationFlag || item.priority === 'high',
  );
  const unreadSupport = supportItems.filter((item) => item.status === 'open');
  const governanceAudit = auditItems.filter((item) => item.action.includes('vote'));
  const profileAudit = auditItems.filter((item) => item.action.includes('profile'));
  const failedLoanCampaigns = campaignItems.filter(
    (item) => item.category === 'loan' && item.status === 'failed',
  );
  const failedKycCampaigns = campaignItems.filter(
    (item) => item.category === 'kyc' && item.status === 'failed',
  );
  const failedAutopayCampaigns = campaignItems.filter(
    (item) => item.category === 'autopay' && item.status === 'failed',
  );
  const activeInsuranceAlerts = insuranceAlerts.filter((item) => item.requiresManagerAction);

  return [
    {
      area: 'Loan Approval Risk',
      signal: `${highValueLoans.length} high-value loans pending decision`,
      status: highValueLoans.length > 0 ? 'Critical' : 'Healthy',
      action:
        highValueLoans.length > 0
          ? 'Escalate senior credit review and clear oldest approval-ready cases first.'
          : 'No elevated approval pressure detected.',
      priority: highValueLoans.length > 0 ? 0 : 7,
      targetLoanId: highValueLoans[0]?.loanId,
      targetLabel: highValueLoans.length > 0 ? 'Open approval queue' : 'No active case',
    },
    {
      area: 'Loan Document Risk',
      signal: `${correctionLoans.length} loans need document correction`,
      status:
        correctionLoans.length >= 3
          ? 'Critical'
          : correctionLoans.length > 0
            ? 'Watch'
            : 'Healthy',
      action:
        correctionLoans.length > 0
          ? 'Drive correction follow-up and verify missing document reasons are explicit.'
          : 'No correction-heavy loan queue detected.',
      priority: correctionLoans.length >= 3 ? 1 : correctionLoans.length > 0 ? 3 : 8,
      targetLoanId: correctionLoans[0]?.loanId,
      targetLabel: correctionLoans.length > 0 ? 'Open correction case' : 'No active case',
    },
    {
      area: 'KYC Exception Risk',
      signal: `${kycNeedsAction.length} onboarding packages need customer action`,
      status: kycNeedsAction.length > 0 ? 'Critical' : 'Healthy',
      action:
        kycNeedsAction.length > 0
          ? 'Push customer correction reminders and keep sensitive services blocked until approval.'
          : 'No outstanding KYC correction queue detected.',
      priority: kycNeedsAction.length > 0 ? 2 : 9,
      targetMemberId: kycNeedsAction[0]?.memberId,
      targetLabel: kycNeedsAction.length > 0 ? 'Open KYC queue' : 'No active case',
    },
    {
      area: 'KYC Review Backlog',
      signal: `${kycInReview.length} onboarding packages are still in active review`,
      status: kycInReview.length >= 3 ? 'Watch' : 'Healthy',
      action:
        kycInReview.length > 0
          ? 'Clear aging review items before they affect service enablement.'
          : 'Active review queue is within normal bounds.',
      priority: kycInReview.length >= 3 ? 4 : 10,
      targetMemberId: kycInReview[0]?.memberId,
      targetLabel: kycInReview.length > 0 ? 'Open review queue' : 'No active case',
    },
    {
      area: 'Support Escalation Risk',
      signal: `${escalatedSupport.length} chats are escalated or high priority`,
      status: escalatedSupport.length > 0 ? 'Critical' : 'Healthy',
      action:
        escalatedSupport.length > 0
          ? 'Route manager attention to escalated conversations and SLA-risk chats.'
          : 'No escalated support pressure detected.',
      priority: escalatedSupport.length > 0 ? 2 : 11,
      targetConversationId: escalatedSupport[0]?.conversationId,
      targetLabel: escalatedSupport.length > 0 ? 'Open escalated chat' : 'No active case',
    },
    {
      area: 'Loan Reminder Delivery Risk',
      signal: `${failedLoanCampaigns.length} loan reminder campaigns failed delivery`,
      status: failedLoanCampaigns.length > 0 ? 'Watch' : 'Healthy',
      action:
        failedLoanCampaigns.length > 0
          ? 'Review loan reminder delivery failures before repayment alerts are missed.'
          : 'No loan reminder delivery failures detected.',
      priority: failedLoanCampaigns.length > 0 ? 5 : 12,
      targetNotificationCategory: failedLoanCampaigns.length > 0 ? 'loan' : undefined,
      targetLabel:
        failedLoanCampaigns.length > 0 ? 'Open loan reminders' : 'No active case',
    },
    {
      area: 'Insurance Renewal Risk',
      signal: `${activeInsuranceAlerts.length} insurance alerts need manager action`,
      status: activeInsuranceAlerts.length > 0 ? 'Watch' : 'Healthy',
      action:
        activeInsuranceAlerts.length > 0
          ? 'Review insurance renewal pressure before linked loan protection lapses.'
          : 'No insurance renewal exceptions detected.',
      priority: activeInsuranceAlerts.length > 0 ? 5 : 12,
      targetNotificationCategory: activeInsuranceAlerts.length > 0 ? 'insurance' : undefined,
      targetLabel:
        activeInsuranceAlerts.length > 0 ? 'Open insurance alerts' : 'No active case',
    },
    {
      area: 'KYC Reminder Delivery Risk',
      signal: `${failedKycCampaigns.length} KYC reminder campaigns failed delivery`,
      status: failedKycCampaigns.length > 0 ? 'Watch' : 'Healthy',
      action:
        failedKycCampaigns.length > 0
          ? 'Review KYC reminder delivery failures before onboarding cases go stale.'
          : 'No KYC reminder delivery failures detected.',
      priority: failedKycCampaigns.length > 0 ? 5 : 12,
      targetNotificationCategory: failedKycCampaigns.length > 0 ? 'kyc' : undefined,
      targetLabel: failedKycCampaigns.length > 0 ? 'Open KYC reminders' : 'No active case',
    },
    {
      area: 'AutoPay Reminder Delivery Risk',
      signal: `${failedAutopayCampaigns.length} AutoPay reminder campaigns failed delivery`,
      status: failedAutopayCampaigns.length > 0 ? 'Watch' : 'Healthy',
      action:
        failedAutopayCampaigns.length > 0
          ? 'Review AutoPay failure reminders before recurring-payment exceptions increase.'
          : 'No AutoPay reminder delivery failures detected.',
      priority: failedAutopayCampaigns.length > 0 ? 5 : 12,
      targetNotificationCategory: failedAutopayCampaigns.length > 0 ? 'autopay' : undefined,
      targetLabel:
        failedAutopayCampaigns.length > 0 ? 'Open AutoPay reminders' : 'No active case',
    },
    {
      area: 'Support Backlog Risk',
      signal: `${unreadSupport.length} support chats remain open`,
      status: unreadSupport.length >= 5 ? 'Watch' : 'Healthy',
      action:
        unreadSupport.length > 0
          ? 'Triage unread conversations before they become escalations.'
          : 'Unread support queue is under control.',
      priority: unreadSupport.length >= 5 ? 5 : 12,
      targetConversationId: unreadSupport[0]?.conversationId,
      targetLabel: unreadSupport.length > 0 ? 'Open unread chat' : 'No active case',
    },
    {
      area: 'Governance Audit Risk',
      signal: `${governanceAudit.length} governance audit events need review`,
      status: governanceAudit.length > 0 ? 'Watch' : 'Healthy',
      action:
        governanceAudit.length > 0
          ? 'Review voting activity and verify governance lifecycle controls remain intact.'
          : 'No governance audit exceptions detected.',
      priority: governanceAudit.length > 0 ? 6 : 13,
      targetAuditEntity: governanceAudit[0]?.entity,
      targetLabel: governanceAudit.length > 0 ? 'Open audit trail' : 'No active case',
    },
    {
      area: 'Profile Change Audit Risk',
      signal: `${profileAudit.length} profile-change audit events were recorded`,
      status: profileAudit.length > 0 ? 'Watch' : 'Healthy',
      action:
        profileAudit.length > 0
          ? 'Inspect recent profile-change evidence for sensitive customer updates.'
          : 'No elevated profile-change audit activity detected.',
      priority: profileAudit.length > 0 ? 6 : 14,
      targetAuditEntity: profileAudit[0]?.entity,
      targetLabel: profileAudit.length > 0 ? 'Open audit trail' : 'No active case',
    },
  ].sort((left, right) => left.priority - right.priority);
}

function renderRiskActionCell(
  item: ReturnType<typeof buildRiskSignals>[number],
  handlers: {
    onOpenLoan?: (loanId: string) => void;
    onOpenKycMember?: (memberId: string) => void;
    onOpenSupportChat?: (conversationId: string) => void;
    onOpenAuditEntity?: (entity: string) => void;
    onOpenNotificationCategory?: (category: NotificationCategory) => void;
  },
) {
  if (item.targetLoanId && handlers.onOpenLoan) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => handlers.onOpenLoan?.(item.targetLoanId!)}
      >
        {item.targetLabel}
      </button>
    );
  }

  if (item.targetMemberId && handlers.onOpenKycMember) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => handlers.onOpenKycMember?.(item.targetMemberId!)}
      >
        {item.targetLabel}
      </button>
    );
  }

  if (item.targetConversationId && handlers.onOpenSupportChat) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => handlers.onOpenSupportChat?.(item.targetConversationId!)}
      >
        {item.targetLabel}
      </button>
    );
  }

  if (item.targetAuditEntity && handlers.onOpenAuditEntity) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => handlers.onOpenAuditEntity?.(item.targetAuditEntity!)}
      >
        {item.targetLabel}
      </button>
    );
  }

  if (item.targetNotificationCategory && handlers.onOpenNotificationCategory) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() =>
          handlers.onOpenNotificationCategory?.(
            item.targetNotificationCategory as NotificationCategory,
          )
        }
      >
        {item.targetLabel}
      </button>
    );
  }

  return <span className="muted">{item.targetLabel}</span>;
}

function isActionableRiskSignal(item: ReturnType<typeof buildRiskSignals>[number]) {
  return Boolean(
    item.targetLoanId ||
      item.targetMemberId ||
      item.targetConversationId ||
      item.targetAuditEntity ||
      item.targetNotificationCategory,
  );
}

function openRiskSignal(
  item: ReturnType<typeof buildRiskSignals>[number],
  handlers: {
    onOpenLoan?: (loanId: string) => void;
    onOpenKycMember?: (memberId: string) => void;
    onOpenSupportChat?: (conversationId: string) => void;
    onOpenAuditEntity?: (entity: string) => void;
    onOpenNotificationCategory?: (category: NotificationCategory) => void;
  },
) {
  if (item.targetLoanId) {
    handlers.onOpenLoan?.(item.targetLoanId);
    return;
  }

  if (item.targetMemberId) {
    handlers.onOpenKycMember?.(item.targetMemberId);
    return;
  }

  if (item.targetConversationId) {
    handlers.onOpenSupportChat?.(item.targetConversationId);
    return;
  }

  if (item.targetAuditEntity) {
    handlers.onOpenAuditEntity?.(item.targetAuditEntity);
    return;
  }

  if (item.targetNotificationCategory) {
    handlers.onOpenNotificationCategory?.(
      item.targetNotificationCategory as NotificationCategory,
    );
  }
}

function formatRiskPriority(priority: number, status: string) {
  if (status === 'Critical') {
    return `P${priority + 1} Critical`;
  }

  if (status === 'Watch') {
    return `P${priority + 1} Watch`;
  }

  return `P${priority + 1} Healthy`;
}
