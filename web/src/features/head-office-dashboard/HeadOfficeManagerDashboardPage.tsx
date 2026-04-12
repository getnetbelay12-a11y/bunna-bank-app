import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  AuditLogItem,
  AutopayOperationItem,
  HeadOfficeCommandCenterSummary,
  InsuranceAlertItem,
  NotificationCategory,
  PerformancePeriod,
  PerformanceSummaryItem,
  RolePerformanceItem,
  RolePerformanceOverview,
  SchoolConsoleOverview,
  SecurityReviewMetrics,
  ServiceRequestItem,
  SupportChatSummaryItem,
} from '../../core/api/contracts';
import { getAccessToken } from '../../core/api/httpApi';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';
import {
  DashboardGrid,
  DashboardMiniBars,
  DashboardMetricRow,
  DashboardPage,
  DashboardPipelineCard,
  DashboardProgressRow,
  DashboardSectionCard,
  QuickActionChip,
} from '../../shared/components/BankingDashboard';
import { ConsoleKpiStrip } from '../../shared/components/ConsoleKpiStrip';
import { CriticalActionStrip } from '../../shared/components/CriticalActionStrip';
import { AuditWatchlistPanel } from '../audit/AuditWatchlistPanel';
import { OperationsSummaryPanel } from './OperationsSummaryPanel';
import { LoanWorkflowWatchlistPanel } from '../loan-monitoring/LoanWorkflowWatchlistPanel';
import { KycWatchlistPanel } from '../manager-pages/KycWatchlistPanel';
import { AutopayOperationsPanel } from '../notifications/AutopayOperationsPanel';
import { NotificationWatchlistPanel } from '../notifications/NotificationWatchlistPanel';
import { SupportWatchlistPanel } from '../support/SupportWatchlistPanel';
import { GovernanceWatchlistPanel } from '../voting/GovernanceWatchlistPanel';

type HeadOfficeManagerDashboardPageProps = {
  session: AdminSession;
  onOpenLoan?: (loanId: string) => void;
  onOpenLoansWorkspace?: () => void;
  onOpenAutopayOperation?: (operationId: string) => void;
  onOpenSupportChat?: (conversationId: string) => void;
  onOpenSupportWorkspace?: () => void;
  onOpenNotificationCategory?: (category: NotificationCategory) => void;
  onOpenKycMember?: (memberId: string) => void;
  onOpenVote?: (voteId: string) => void;
  onOpenAuditEntity?: (entity: string) => void;
  onOpenAuditWorkspace?: (actionType?: string) => void;
  onOpenRisk?: () => void;
  onOpenServiceRequests?: () => void;
};

const periods: PerformancePeriod[] = ['today', 'week', 'month', 'year'];
const SUPPORTED_SECURITY_REVIEW_METRICS_CONTRACT_VERSION = 'security_review_metrics.v2';

export function HeadOfficeManagerDashboardPage({
  session,
  onOpenLoan,
  onOpenLoansWorkspace,
  onOpenAutopayOperation,
  onOpenSupportChat,
  onOpenSupportWorkspace,
  onOpenNotificationCategory,
  onOpenKycMember,
  onOpenVote,
  onOpenAuditEntity,
  onOpenAuditWorkspace,
  onOpenRisk,
  onOpenServiceRequests,
}: HeadOfficeManagerDashboardPageProps) {
  const { auditApi, dashboardApi, notificationApi, schoolConsoleApi, serviceRequestApi, supportApi } = useAppClient();
  const [period, setPeriod] = useState<PerformancePeriod>('week');
  const [activeView, setActiveView] = useState<'operations' | 'queues' | 'governance'>(
    'operations',
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RolePerformanceItem['status']>('all');
  const [sortBy, setSortBy] = useState<
    'score' | 'response' | 'members' | 'loans' | 'transactions' | 'kyc' | 'support'
  >('score');
  const [districtMetricView, setDistrictMetricView] = useState<'loans' | 'transactions'>('loans');
  const [overview, setOverview] = useState<RolePerformanceOverview | null>(null);
  const [topDistricts, setTopDistricts] = useState<RolePerformanceItem[]>([]);
  const [watchlist, setWatchlist] = useState<RolePerformanceItem[]>([]);
  const [commandCenter, setCommandCenter] =
    useState<HeadOfficeCommandCenterSummary | null>(null);
  const [branchPerformance, setBranchPerformance] = useState<PerformanceSummaryItem[]>([]);
  const [schoolOverview, setSchoolOverview] = useState<SchoolConsoleOverview | null>(null);
  const [openChats, setOpenChats] = useState<SupportChatSummaryItem[]>([]);
  const [insuranceAlerts, setInsuranceAlerts] = useState<InsuranceAlertItem[]>([]);
  const [autopayOperations, setAutopayOperations] = useState<AutopayOperationItem[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestItem[]>([]);
  const [securityReviewMetrics, setSecurityReviewMetrics] = useState<SecurityReviewMetrics | null>(null);
  const [compatibilityAuditAlerts, setCompatibilityAuditAlerts] = useState<AuditLogItem[]>([]);
  const [kycQueueCount, setKycQueueCount] = useState(0);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [demoBusy, setDemoBusy] = useState<'school' | 'chat' | 'loan' | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      dashboardApi.getHeadOfficeCommandCenter(session.role, period),
      dashboardApi.getHeadOfficeDistrictSummary(session.role, period),
      dashboardApi.getHeadOfficeTopDistricts(session.role, period),
      dashboardApi.getHeadOfficeDistrictWatchlist(session.role, period),
      dashboardApi.getBranchPerformance(session.role),
      dashboardApi.getOnboardingReviewQueue(session.role),
      dashboardApi.getAutopayOperations(session.role),
      auditApi.getByEntity(session.role),
      serviceRequestApi?.getRequests() ?? Promise.resolve({ items: [], total: 0, page: 1, limit: 20 }),
      serviceRequestApi?.getSecurityReviewMetrics?.() ?? Promise.resolve(null),
      supportApi.getOpenChats(),
      notificationApi.getInsuranceAlerts(),
      schoolConsoleApi?.getOverview() ?? Promise.resolve(null),
    ]).then(([
      commandCenterResult,
      summaryResult,
      topResult,
      watchlistResult,
      branchPerformanceResult,
      onboardingQueue,
      autopayResult,
      auditLogResult,
      serviceRequestResult,
      securityReviewMetricsResult,
      openChatResult,
      insuranceResult,
      schoolOverviewResult,
    ]) => {
      if (cancelled) {
        return;
      }

      setCommandCenter(commandCenterResult);
      setOverview(summaryResult);
      setTopDistricts(topResult);
      setWatchlist(watchlistResult);
      setBranchPerformance(branchPerformanceResult);
      setKycQueueCount(onboardingQueue.length);
      setAutopayOperations(autopayResult);
      setCompatibilityAuditAlerts(
        auditLogResult
          .filter(
            (item) => item.action === 'unsupported_security_review_metrics_contract_detected',
          )
          .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
          .slice(0, 3),
      );
      setServiceRequests(serviceRequestResult.items);
      setSecurityReviewMetrics(securityReviewMetricsResult);
      setOpenChats(openChatResult);
      setInsuranceAlerts(insuranceResult);
      setSchoolOverview(schoolOverviewResult);
    });

    return () => {
      cancelled = true;
    };
  }, [auditApi, dashboardApi, notificationApi, period, schoolConsoleApi, serviceRequestApi, session.role, supportApi]);

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

  const maxDistrictMetric = Math.max(
    ...items.map((item) =>
      districtMetricView === 'transactions' ? item.transactionsProcessed : item.loansHandled,
    ),
    1,
  );
  const maxScore = Math.max(...items.map((item) => item.score), 1);
  const criticalDistrictCount = items.filter((item) => item.status === 'needs_support').length;
  const overdueLoansCount = commandCenter?.riskAlerts.loanAlerts ?? 0;
  const missingDocumentsCount = Math.max((kpis?.membersServed ?? 0) - (kpis?.kycCompleted ?? 0), 0);
  const expiringInsuranceCount = insuranceAlerts.filter((item) => item.requiresManagerAction).length;
  const unansweredChatsCount = openChats.filter((item) => item.status !== 'resolved').length;
  const autopayFailuresCount = autopayOperations.filter(
    (item) => item.operationalStatus === 'paused' || item.actionRequired.trim().length > 0,
  ).length;
  const securityReviewItems = serviceRequests.filter((item) => item.type === 'security_review');
  const fallbackSecurityMetrics = buildSecurityTrendMetrics(securityReviewItems);
  const hasSupportedSecurityReviewMetrics =
    securityReviewMetrics?.metadata.contractVersion ===
    SUPPORTED_SECURITY_REVIEW_METRICS_CONTRACT_VERSION;
  const hasUnsupportedSecurityReviewMetrics =
    securityReviewMetrics != null && !hasSupportedSecurityReviewMetrics;
  const breachedSecurityReviewsCount =
    (hasSupportedSecurityReviewMetrics
      ? securityReviewMetrics.currentState.breachedCount
      : null) ??
    securityReviewItems.filter((item) => item.slaState === 'overdue').length;
  const dueSoonSecurityReviewsCount =
    (hasSupportedSecurityReviewMetrics
      ? securityReviewMetrics.currentState.dueSoonCount
      : null) ??
    securityReviewItems.filter((item) => item.slaState === 'due_soon').length;
  const stalledSecurityReviewsCount =
    (hasSupportedSecurityReviewMetrics
      ? securityReviewMetrics.currentState.stalledCount
      : null) ??
    securityReviewItems.filter((item) => item.followUpState === 'investigation_stalled').length;
  const takeoverSecurityReviewsCount =
    (hasSupportedSecurityReviewMetrics
      ? securityReviewMetrics.currentState.takeoverCount
      : null) ??
    securityReviewItems.filter((item) => typeof item.escalatedAt === 'string' && item.escalatedAt.trim().length > 0).length;
  const securityTrend =
    hasSupportedSecurityReviewMetrics
      ? buildSecurityTrendMetricsFromBackend(securityReviewMetrics)
      : fallbackSecurityMetrics;
  const securityMetricBasisLabel =
    securityReviewMetrics == null
      ? 'Fallback: all values derived from current loaded queue rows'
      : hasSupportedSecurityReviewMetrics
        ? `Contract ${securityReviewMetrics.metadata.contractVersion}. Current state from live queue. Trend from retained history (${securityReviewMetrics.metadata.retentionWindowDays}d retention basis).`
        : `Unsupported contract ${securityReviewMetrics.metadata.contractVersion}. Falling back to current loaded queue rows only.`;
  const compatibilityAlertCount = compatibilityAuditAlerts.length;
  const totalAlertsCount =
    overdueLoansCount +
    missingDocumentsCount +
    expiringInsuranceCount +
    unansweredChatsCount +
    breachedSecurityReviewsCount +
    stalledSecurityReviewsCount +
    compatibilityAlertCount;
  const paidSchoolInvoicesCount =
    schoolOverview?.invoices.filter((item) => item.status === 'paid').length ?? 0;
  const unpaidSchoolInvoicesCount =
    schoolOverview?.invoices.filter((item) => item.status !== 'paid').length ?? 0;
  const overdueSchoolInvoicesCount =
    schoolOverview?.invoices.filter((item) => item.balance > 0).length ?? 0;
  const loanPipeline = buildLoanPipeline(commandCenter?.pendingApprovals ?? 0);
  const selectedDistrict =
    filteredItems.find((item) => item.entityId === selectedDistrictId) ??
    items.find((item) => item.entityId === selectedDistrictId) ??
    null;
  const demoApiBaseUrl = resolveDemoApiBaseUrl();

  async function triggerDemoAction(
    kind: 'school' | 'chat' | 'loan',
    path: string,
    body: Record<string, unknown>,
  ) {
    if (!demoApiBaseUrl) {
      setDemoMessage('Backend demo triggers are available only in local demo mode.');
      return;
    }

    try {
      setDemoBusy(kind);
      setDemoMessage(null);
      const response = await fetch(`${demoApiBaseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Demo action failed with HTTP ${response.status}.`);
      }

      setDemoMessage(
        kind === 'school'
          ? 'School payment reminder sent to the demo member.'
          : kind === 'chat'
            ? 'Demo support chat created for the mobile flow.'
            : 'Demo loan moved to head office review.',
      );
    } catch (error) {
      setDemoMessage(error instanceof Error ? error.message : 'Demo action failed.');
    } finally {
      setDemoBusy(null);
    }
  }

  useEffect(() => {
    if (
      !hasUnsupportedSecurityReviewMetrics ||
      !securityReviewMetrics ||
      !serviceRequestApi?.reportSecurityReviewMetricsContractIssue
    ) {
      return;
    }

    const storageKey = `security-review-metrics-contract-warning:${securityReviewMetrics.metadata.contractVersion}`;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(storageKey) === 'reported') {
      return;
    }

    void serviceRequestApi
      .reportSecurityReviewMetricsContractIssue({
        detectedContractVersion: securityReviewMetrics.metadata.contractVersion,
        supportedContractVersion: SUPPORTED_SECURITY_REVIEW_METRICS_CONTRACT_VERSION,
        source: 'head_office_dashboard',
      })
      .then(() => {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(storageKey, 'reported');
        }
      })
      .catch(() => {
        // Keep the UI warning visible even if the durable signal write fails.
      });
  }, [hasUnsupportedSecurityReviewMetrics, securityReviewMetrics, serviceRequestApi]);

  return (
    <DashboardPage>
      <div className="head-office-page">
      <section className="head-office-mission-grid">
        <article className="head-office-mission-card head-office-mission-card-primary">
          <div className="head-office-mission-copy">
            <p className="eyebrow">Executive Command</p>
            <h3>Head office banking control center for lending, support, KYC, and school collections.</h3>
            <p>
              Surface the bank&apos;s biggest issues first, then move into district execution,
              queue pressure, and demo triggers without scanning through long stacked sections.
            </p>
          </div>
          <div className="head-office-mission-stats">
            <div>
              <span>Customers</span>
              <strong>{commandCenter ? commandCenter.totalCustomers.toLocaleString() : 'Not available'}</strong>
            </div>
            <div>
              <span>Savings</span>
              <strong>{commandCenter ? `ETB ${commandCenter.totalSavings.toLocaleString()}` : 'Not available'}</strong>
            </div>
            <div>
              <span>Pending Approvals</span>
              <strong>{commandCenter ? commandCenter.pendingApprovals.toLocaleString() : 'Not available'}</strong>
            </div>
            <div>
              <span>Open Chats</span>
              <strong>{unansweredChatsCount.toLocaleString()}</strong>
            </div>
          </div>
        </article>

        <article className="head-office-mission-card head-office-mission-card-risk">
          <p className="eyebrow">Priority Signals</p>
          <h3>What requires executive attention now</h3>
          {hasUnsupportedSecurityReviewMetrics ? (
            <div
              style={{
                marginBottom: '0.9rem',
                border: '1px solid rgba(217, 119, 6, 0.45)',
                background:
                  'linear-gradient(135deg, rgba(255, 247, 237, 0.96), rgba(254, 215, 170, 0.32))',
                borderRadius: '18px',
                padding: '0.9rem 1rem',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgb(146, 64, 14)',
                  fontWeight: 700,
                }}
              >
                Reporting compatibility warning
              </p>
              <p
                style={{
                  margin: '0.35rem 0 0',
                  color: 'rgb(120, 53, 15)',
                  lineHeight: 1.5,
                }}
              >
                Security-review metrics contract{' '}
                <strong>{securityReviewMetrics.metadata.contractVersion}</strong> is not supported
                by this dashboard. Queue counts and trend labels below are running in fallback mode
                from currently loaded service-request rows, not the retained reporting contract.
              </p>
            </div>
          ) : null}
          <div className="support-overview-stack">
            <DashboardMetricRow
              label="Overdue Loans"
              value={overdueLoansCount.toLocaleString()}
              note="Recovery posture and branch follow-up"
            />
            <DashboardMetricRow
              label="Missing Documents"
              value={missingDocumentsCount.toLocaleString()}
              note="Loan evidence and KYC gaps"
            />
            <DashboardMetricRow
              label="Insurance Risk"
              value={expiringInsuranceCount.toLocaleString()}
              note="Policies nearing expiry"
            />
            <DashboardMetricRow
              label="Security SLA Breaches"
              value={breachedSecurityReviewsCount.toLocaleString()}
              note={`${dueSoonSecurityReviewsCount.toLocaleString()} due soon`}
            />
            <DashboardMetricRow
              label="Security Stalled"
              value={stalledSecurityReviewsCount.toLocaleString()}
              note={`${takeoverSecurityReviewsCount.toLocaleString()} manager takeovers`}
            />
            <DashboardMetricRow
              label="Security Trend"
              value={securityTrend.stalledTrendLabel}
              note={securityTrend.takeoverTrendLabel}
            />
            <DashboardMetricRow
              label="Security Metric Basis"
              value={
                securityReviewMetrics == null
                  ? 'Fallback mode'
                  : hasSupportedSecurityReviewMetrics
                    ? securityReviewMetrics.metadata.contractVersion
                    : 'Unsupported contract'
              }
              note={securityMetricBasisLabel}
            />
            <DashboardMetricRow
              label="Reporting Contract Alerts"
              value={compatibilityAlertCount.toLocaleString()}
              note={
                compatibilityAlertCount > 0
                  ? `Latest: ${formatCompatibilityAlertLabel(compatibilityAuditAlerts[0])}`
                  : 'No unsupported security metrics contracts detected'
              }
              onClick={
                compatibilityAlertCount > 0
                  ? () =>
                      onOpenAuditWorkspace?.(
                        'unsupported_security_review_metrics_contract_detected',
                      )
                  : undefined
              }
            />
          </div>
        </article>

        <article className="head-office-mission-card head-office-mission-card-actions">
          <p className="eyebrow">Demo Snapshot</p>
          <h3>Fast-read flow summary</h3>
          <div className="support-overview-stack">
            <DashboardMetricRow
              label="School Payments"
              value={schoolOverview?.summary.students.toLocaleString() ?? '0'}
              note={`${overdueSchoolInvoicesCount.toLocaleString()} overdue students`}
            />
            <DashboardMetricRow
              label="Loan Pipeline"
              value={loanPipeline[0]?.value.toLocaleString() ?? '0'}
              note="Submitted files in motion"
            />
            <DashboardMetricRow
              label="KYC Queue"
              value={kycQueueCount.toLocaleString()}
              note="Pending onboarding review"
            />
          </div>
        </article>
      </section>

      <ConsoleKpiStrip
        items={[
          {
            icon: 'CU',
            label: 'Customers',
            value: commandCenter ? commandCenter.totalCustomers.toLocaleString() : 'Not available',
            trend: commandCenter
              ? `${commandCenter.totalShareholders.toLocaleString()} shareholders`
              : 'No trend',
            trendDirection: 'up',
          },
          {
            icon: 'LN',
            label: 'Loans',
            value: commandCenter ? commandCenter.totalLoans.toLocaleString() : 'Not available',
            trend: `${overdueLoansCount.toLocaleString()} overdue`,
            trendDirection: 'down',
          },
          {
            icon: 'SV',
            label: 'Savings',
            value: commandCenter ? `ETB ${commandCenter.totalSavings.toLocaleString()}` : 'Not available',
            trend: kpis ? `${kpis.transactionsProcessed.toLocaleString()} txns` : 'No trend',
            trendDirection: 'up',
          },
          {
            icon: 'AP',
            label: 'Approvals',
            value: commandCenter ? commandCenter.pendingApprovals.toLocaleString() : 'Not available',
            trend: commandCenter && commandCenter.pendingApprovals > 40 ? 'Needs action' : 'Stable',
            trendDirection: commandCenter && commandCenter.pendingApprovals > 40 ? 'down' : 'up',
          },
          {
            icon: 'AL',
            label: 'Alerts',
            value: totalAlertsCount.toLocaleString(),
            trend:
              stalledSecurityReviewsCount > 0
                ? `${stalledSecurityReviewsCount.toLocaleString()} stalled security reviews`
                : breachedSecurityReviewsCount > 0
                  ? `${breachedSecurityReviewsCount.toLocaleString()} breached security reviews`
                : `${criticalDistrictCount.toLocaleString()} critical districts`,
            trendDirection: 'down',
          },
          {
            icon: 'SR',
            label: 'Security Stalls',
            value: stalledSecurityReviewsCount.toLocaleString(),
            trend: securityTrend.stalledTrendLabel,
            trendDirection: securityTrend.stalledTrendDirection,
          },
          {
            icon: 'TK',
            label: 'Takeovers',
            value: takeoverSecurityReviewsCount.toLocaleString(),
            trend: securityTrend.takeoverTrendLabel,
            trendDirection: securityTrend.takeoverTrendDirection,
          },
        ]}
      />

      <CriticalActionStrip
        items={[
          {
            label: 'Overdue Loans',
            value: overdueLoansCount.toLocaleString(),
            tone: 'red',
            onClick: () => onOpenLoansWorkspace?.(),
          },
          {
            label: 'Missing Docs',
            value: missingDocumentsCount.toLocaleString(),
            tone: 'orange',
            onClick: () => onOpenRisk?.(),
          },
          {
            label: 'Support Backlog',
            value: unansweredChatsCount.toLocaleString(),
            tone: 'red',
            onClick: () => onOpenSupportWorkspace?.(),
          },
          {
            label: 'Security Breaches',
            value: breachedSecurityReviewsCount.toLocaleString(),
            tone: breachedSecurityReviewsCount > 0 ? 'red' : 'amber',
            onClick: () => onOpenServiceRequests?.(),
          },
          {
            label: 'Security Takeovers',
            value: takeoverSecurityReviewsCount.toLocaleString(),
            tone: stalledSecurityReviewsCount > 0 ? 'orange' : 'amber',
            onClick: () => onOpenServiceRequests?.(),
          },
          {
            label: 'Expiring Insurance',
            value: expiringInsuranceCount.toLocaleString(),
            tone: 'amber',
            onClick: () => onOpenNotificationCategory?.('insurance'),
          },
        ]}
      />

      {demoApiBaseUrl ? (
        <DashboardSectionCard
          title="Demo Triggers"
          description="Local controls for the executive demo flow."
          action={<QuickActionChip label="Local only" />}
        >
          <div className="flex flex-wrap gap-3">
            <QuickActionChip
              label={demoBusy === 'school' ? 'Triggering school alert...' : 'Trigger school alert'}
              onClick={() =>
                void triggerDemoAction('school', '/demo/notifications/school-payment', {
                  profileId: 'school_profile_001',
                })
              }
            />
            <QuickActionChip
              label={demoBusy === 'chat' ? 'Creating demo chat...' : 'Create demo chat'}
              onClick={() =>
                void triggerDemoAction('chat', '/demo/chat/create', {
                  initialMessage:
                    'Hello, I need help with the school payment and loan status demo.',
                })
              }
            />
            <QuickActionChip
              label={demoBusy === 'loan' ? 'Updating loan...' : 'Move loan to head office'}
              onClick={() =>
                void triggerDemoAction('loan', '/demo/loan/update', {
                  status: 'head_office_review',
                  comment: 'Loan moved to head office review for the executive demo.',
                })
              }
            />
          </div>
          {demoMessage ? <p className="muted">{demoMessage}</p> : null}
        </DashboardSectionCard>
      ) : null}

      <DashboardGrid>
        <DashboardSectionCard
          title="District Performance"
          description="Top districts with response and approval posture."
          action={<QuickActionChip label={`${filteredItems.length} in scope`} />}
        >
          <div className="flex flex-col gap-3">
            {filteredItems.slice(0, 5).map((item) => (
              <DashboardProgressRow
                key={item.entityId}
                label={item.name}
                value={`${item.score} score • ${item.responseTimeMinutes} min`}
                progress={Math.min(item.score, 100)}
                tone={item.status === 'needs_support' ? 'red' : item.status === 'watch' ? 'amber' : 'blue'}
              />
            ))}
            <DashboardMiniBars
              items={filteredItems.slice(0, 4).map((item) => ({
                label: item.name.replace(/\s+District$/i, ''),
                value: item.score,
                tone:
                  item.status === 'needs_support'
                    ? 'red'
                    : item.status === 'watch'
                      ? 'amber'
                      : 'blue',
              }))}
            />
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Support Overview"
          description="Backlog, escalation pressure, and live chat posture."
          action={<QuickActionChip label="Open support" onClick={onOpenSupportWorkspace} />}
        >
          <div className="flex flex-col gap-3">
            <DashboardMetricRow
              label="Open Chats"
              value={commandCenter?.supportOverview.openChats.toLocaleString() ?? '0'}
              note={`${commandCenter?.supportOverview.escalatedChats.toLocaleString() ?? '0'} escalated`}
            />
            <DashboardMetricRow
              label="Assigned"
              value={openChats.length.toLocaleString()}
              note={`${unansweredChatsCount.toLocaleString()} unresolved`}
            />
            {openChats.slice(0, 3).map((chat) => (
              <DashboardProgressRow
                key={chat.conversationId}
                label={chat.memberName ?? chat.customerId}
                value={formatLabel(chat.status)}
                progress={chat.escalationFlag ? 92 : chat.priority === 'high' ? 78 : 56}
                tone={chat.escalationFlag ? 'red' : chat.priority === 'high' ? 'amber' : 'blue'}
              />
            ))}
            <DashboardMiniBars
              items={[
                { label: 'Open', value: commandCenter?.supportOverview.openChats ?? 0, tone: 'red' },
                { label: 'Assigned', value: openChats.length, tone: 'blue' },
                {
                  label: 'Escalated',
                  value: commandCenter?.supportOverview.escalatedChats ?? 0,
                  tone: 'amber',
                },
                { label: 'Resolved', value: Math.max(openChats.length - unansweredChatsCount, 0), tone: 'green' },
              ]}
            />
          </div>
        </DashboardSectionCard>
      </DashboardGrid>

      <DashboardGrid>
        <DashboardPipelineCard
          title="Loan Pipeline"
          description="Clear stage-by-stage loan flow across the bank."
          stages={loanPipeline.map((stage) => ({
            label: stage.label,
            value: stage.value.toLocaleString(),
            progress: stage.width,
            tone:
              stage.tone === 'warning'
                ? 'amber'
                : stage.tone === 'teal'
                  ? 'teal'
                  : stage.tone === 'success'
                    ? 'green'
                    : 'blue',
          }))}
        />

        <DashboardSectionCard
          title="KYC Status"
          description="Pending onboarding and document completion posture."
        >
          <div className="flex flex-col gap-3">
            <DashboardMetricRow
              label="Completed"
              value={kpis?.kycCompleted.toLocaleString() ?? '0'}
              note={`${kycQueueCount.toLocaleString()} pending review`}
            />
            <DashboardProgressRow
              label="Completion Rate"
              value={
                kpis && kpis.membersServed > 0
                  ? `${Math.round((kpis.kycCompleted / kpis.membersServed) * 100)}%`
                  : 'Not available'
              }
              progress={Math.min(((kpis?.kycCompleted ?? 0) / Math.max(kpis?.membersServed ?? 1, 1)) * 100, 100)}
              tone={kycQueueCount > 40 ? 'amber' : 'green'}
            />
          </div>
        </DashboardSectionCard>
      </DashboardGrid>

      <DashboardGrid>
        <DashboardSectionCard
          title="School Payments"
          description="Student billing posture and reminder workflow."
          action={<QuickActionChip label="Send reminder" onClick={() => onOpenNotificationCategory?.('payment')} />}
        >
          <div className="flex flex-col gap-3">
            <DashboardMetricRow
              label="Students"
              value={schoolOverview?.summary.students.toLocaleString() ?? '0'}
              note={`${paidSchoolInvoicesCount.toLocaleString()} paid today`}
            />
            <DashboardProgressRow
              label="Paid vs Unpaid"
              value={`${overdueSchoolInvoicesCount.toLocaleString()} overdue`}
              progress={(paidSchoolInvoicesCount / Math.max(paidSchoolInvoicesCount + unpaidSchoolInvoicesCount, 1)) * 100}
              tone={overdueSchoolInvoicesCount > 0 ? 'amber' : 'green'}
            />
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Performance Summary"
          description="Visual branch execution bars instead of dense text."
        >
          <div className="flex flex-col gap-3">
            {branchPerformance.slice(0, 4).map((item) => (
              <DashboardProgressRow
                key={item.scopeId}
                label={formatLabel(item.scopeId)}
                value={`${Math.min(
                  Math.round(
                    ((item.loanApprovedCount + item.schoolPaymentsCount + item.customersServed / 10) / 120) * 100,
                  ),
                  99,
                )}% score`}
                progress={Math.min(
                  Math.round(
                    ((item.loanApprovedCount + item.schoolPaymentsCount + item.customersServed / 10) / 120) * 100,
                  ),
                  99,
                )}
                tone="blue"
              />
            ))}
          </div>
          <DashboardMiniBars
            items={branchPerformance.slice(0, 5).map((item) => ({
              label: item.scopeId.split('-')[0] ?? item.scopeId,
              value: Math.min(
                Math.round(
                  ((item.loanApprovedCount + item.schoolPaymentsCount + item.customersServed / 10) / 120) * 100,
                ),
                99,
              ),
              tone: 'blue',
            }))}
          />
        </DashboardSectionCard>
      </DashboardGrid>

      {activeView === 'operations' ? (
      <section className="dashboard-section-block dashboard-section-operations">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">Operations Control</p>
            <h3>Daily command and district execution</h3>
            <p className="muted">
              A cleaner executive layer for operational queues, district health, and intervention posture.
            </p>
          </div>
          <div className="dashboard-section-heading-meta">
            <SectionPill
              label="Risk"
              value={commandCenter ? `${commandCenter.riskAlerts.totalAlerts} alerts` : 'No alerts'}
            />
            <SectionPill
              label="Approvals"
              value={commandCenter ? `${commandCenter.pendingApprovals} pending` : 'No approvals'}
            />
            <SectionPill
              label="Response"
              value={kpis ? `${kpis.responseTimeMinutes} min avg` : 'Not available'}
            />
          </div>
        </div>
        <div className="dashboard-primary-stack">
          <OperationsSummaryPanel
            role={session.role}
            onOpenAudit={onOpenAuditWorkspace}
            onOpenLoans={onOpenLoansWorkspace}
            onOpenRisk={onOpenRisk}
            onOpenSupport={onOpenSupportWorkspace}
          />

          <Panel title="District Ranking" description="Executive comparison across districts with ranking, transaction volume, and intervention priorities.">
            <p className="muted">
              Watchlist districts should be handled first where KYC clearance is weak, response time is high,
              or member-facing secure services are likely to be blocked.
            </p>
            <div className="dashboard-toolbar">
              <div className="field-stack">
                <span>Metric View</span>
                <div className="dashboard-segmented-control" role="tablist" aria-label="District ranking metric">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={districtMetricView === 'loans'}
                    className={
                      districtMetricView === 'loans'
                        ? 'dashboard-segmented-control-button active'
                        : 'dashboard-segmented-control-button'
                    }
                    onClick={() => setDistrictMetricView('loans')}
                  >
                    Loans
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={districtMetricView === 'transactions'}
                    className={
                      districtMetricView === 'transactions'
                        ? 'dashboard-segmented-control-button active'
                        : 'dashboard-segmented-control-button'
                    }
                    onClick={() => setDistrictMetricView('transactions')}
                  >
                    Transactions
                  </button>
                </div>
              </div>
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
                        | 'transactions'
                        | 'kyc'
                        | 'support',
                    )
                  }
                >
                  <option value="score">Score</option>
                  <option value="response">Response time</option>
                  <option value="members">Members</option>
                  <option value="loans">Loans</option>
                  <option value="transactions">Transactions</option>
                  <option value="kyc">KYC</option>
                  <option value="support">Support</option>
                </select>
              </label>
            </div>

            <div className="district-performance-wrap">
              <div className="district-performance-board">
                <div className="district-performance-header">
                  <span>District</span>
                  <span>
                    {districtMetricView === 'transactions' ? 'Transactions handled' : 'Loans'}
                  </span>
                  <span>Response</span>
                  <span>Score</span>
                  <span>Action</span>
                </div>

                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <article
                      key={item.entityId}
                      className={
                        selectedDistrictId === item.entityId
                          ? 'district-performance-row selected'
                          : 'district-performance-row'
                      }
                      onClick={() => setSelectedDistrictId(item.entityId)}
                    >
                      <div className="district-name-cell">
                        <strong>{item.name}</strong>
                        <span className="muted">
                          {item.pendingTasks.toLocaleString()} pending tasks
                        </span>
                      </div>
                      <MetricBar
                        value={
                          districtMetricView === 'transactions'
                            ? item.transactionsProcessed
                            : item.loansHandled
                        }
                        max={maxDistrictMetric}
                        tone="secondary"
                        label={
                          districtMetricView === 'transactions'
                            ? item.transactionsProcessed.toLocaleString()
                            : item.loansHandled.toLocaleString()
                        }
                      />
                      <div className="district-response-cell">{item.responseTimeMinutes} min</div>
                      <MetricBar
                        value={item.score}
                        max={maxScore}
                        tone={scoreTone(item.status)}
                        label={`${item.score}`}
                      />
                      <div className="district-action-cell">
                        <button
                          type="button"
                          className="district-action-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedDistrictId(item.entityId);
                          }}
                        >
                          Review
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
      </section>
      ) : null}

      {activeView === 'queues' ? (
      <section className="dashboard-section-block dashboard-section-workbench">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">Queues and Worklists</p>
            <h3>Institution workbench</h3>
            <p className="muted">
              Focus queues grouped by lending, support, notifications, compliance, and recurring operations.
            </p>
          </div>
          <div className="dashboard-section-heading-meta">
            <SectionPill
              label="Loans"
              value={kpis ? `${kpis.loansHandled} handled` : 'Not available'}
            />
            <SectionPill
              label="Support"
              value={commandCenter ? `${commandCenter.supportOverview.openChats} open` : 'Not available'}
            />
            <SectionPill
              label="KYC"
              value={kpis ? `${kpis.kycCompleted} reviewed` : 'Not available'}
            />
          </div>
        </div>
        <div className="two-column-grid dashboard-asymmetric-grid">
          <LoanWorkflowWatchlistPanel
            title="Loan Workflow Watchlist"
            description="Executive view of queue pressure, approval-ready files, and correction-heavy cases across the institution."
            emptyActionLabel="Complete executive review"
            onOpenLoan={onOpenLoan}
          />

          <SupportWatchlistPanel
            title="Support Watchlist"
            description="Executive view of unread, escalated, and high-priority support conversations."
            onOpenChat={onOpenSupportChat}
          />
        </div>

        <div className="two-column-grid dashboard-asymmetric-grid dashboard-asymmetric-grid-reverse">
          <NotificationWatchlistPanel
            title="Notification Watchlist"
            description="Executive view of reminder workload, delivery failures, and insurance alert pressure."
            onOpenCategory={onOpenNotificationCategory}
          />

          <AutopayOperationsPanel
            role={session.role}
            title="AutoPay Operations"
            description="Executive view of standing instructions that need monitoring, pause recovery, or reminder support."
            onOpenCategory={onOpenNotificationCategory}
            onOpenOperation={onOpenAutopayOperation}
          />
        </div>

        <div className="two-column-grid dashboard-balanced-grid">
          <KycWatchlistPanel
            role={session.role}
            title="KYC Watchlist"
            description="Executive view of onboarding review pressure, customer correction work, and approval readiness."
            onOpenMember={onOpenKycMember}
          />

          <Panel title="District Watchlist" description="Districts needing intervention or support.">
            <SimpleTable
              headers={['District', 'Pending Tasks', 'Escalated Loans', 'Response', 'Action']}
              rows={
                watchlist.length > 0
                  ? watchlist.map((item) => [
                      item.name,
                      item.pendingTasks.toLocaleString(),
                      item.loansEscalated.toLocaleString(),
                      `${item.responseTimeMinutes} min`,
                      item.status === 'needs_support'
                        ? 'Dispatch audit and compliance support'
                        : 'Coach district operations lead',
                    ])
                  : [['Loading', '...', '...', '...', '...']]
              }
            />
          </Panel>
        </div>
      </section>
      ) : null}

      {activeView === 'governance' ? (
      <section className="dashboard-section-block dashboard-section-governance">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">Governance and Control</p>
            <h3>Oversight, audit, and leadership assurance</h3>
            <p className="muted">
              Governance reviews, audit watchlists, and top district benchmarks in one oversight layer.
            </p>
          </div>
          <div className="dashboard-section-heading-meta">
            <SectionPill
              label="Votes"
              value={commandCenter ? `${commandCenter.governanceStatus.activeVotes} active` : 'Not available'}
            />
            <SectionPill
              label="Announcements"
              value={
                commandCenter
                  ? `${commandCenter.governanceStatus.shareholderAnnouncements} published`
                  : 'Not available'
              }
            />
            <SectionPill
              label="Shareholders"
              value={commandCenter ? commandCenter.totalShareholders.toLocaleString() : 'Not available'}
            />
          </div>
        </div>
        <div className="two-column-grid dashboard-asymmetric-grid">
          <GovernanceWatchlistPanel role={session.role} onOpenVote={onOpenVote} />

          <AuditWatchlistPanel role={session.role} onOpenEntity={onOpenAuditEntity} />
        </div>

        <div className="two-column-grid dashboard-balanced-grid">
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

          <Panel title="Governance Snapshot" description="Small oversight block for voting and regional stability.">
            <SimpleTable
              headers={['District', 'Status', 'Support', 'Intervention']}
              rows={
                [...topDistricts.slice(0, 2), ...watchlist.slice(0, 2)].length > 0
                  ? [...topDistricts.slice(0, 2), ...watchlist.slice(0, 2)].map((item) => [
                      item.name,
                      formatStatusLabel(item.status),
                      `${item.supportResolved.toLocaleString()} resolved`,
                      item.status === 'needs_support'
                        ? 'Immediate district support'
                        : item.status === 'watch'
                          ? 'Monitor and coach'
                          : 'Sustain and replicate',
                    ])
                  : [['Loading', '...', '...', '...']]
              }
            />
          </Panel>
        </div>
      </section>
      ) : null}
      <aside className="live-chat-side-panel">
        <div className="live-chat-side-panel-header">
          <div>
            <p className="eyebrow">Live Chat</p>
            <h3>Support attention</h3>
          </div>
          <button type="button" className="live-chat-link" onClick={() => onOpenSupportWorkspace?.()}>
            Open desk
          </button>
        </div>
        <div className="live-chat-list">
          {openChats.slice(0, 4).map((chat) => (
            <button
              key={chat.conversationId}
              type="button"
              className="live-chat-item"
              onClick={() => onOpenSupportChat?.(chat.conversationId)}
            >
              <strong>{chat.memberName ?? chat.customerId}</strong>
              <span>{chat.issueCategory}</span>
              <small>{chat.lastMessage}</small>
            </button>
          ))}
          {openChats.length === 0 ? <div className="live-chat-empty">No live chats waiting.</div> : null}
        </div>
      </aside>
      </div>
    </DashboardPage>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function compareDistricts(
  left: RolePerformanceItem,
  right: RolePerformanceItem,
  sortBy: 'score' | 'response' | 'members' | 'loans' | 'transactions' | 'kyc' | 'support',
) {
  switch (sortBy) {
    case 'response':
      return left.responseTimeMinutes - right.responseTimeMinutes;
    case 'members':
      return right.membersServed - left.membersServed;
    case 'loans':
      return right.loansHandled - left.loansHandled;
    case 'transactions':
      return right.transactionsProcessed - left.transactionsProcessed;
    case 'kyc':
      return right.kycCompleted - left.kycCompleted;
    case 'support':
      return right.supportResolved - left.supportResolved;
    case 'score':
    default:
      return right.score - left.score;
  }
}

function buildSecurityTrendMetrics(items: ServiceRequestItem[]) {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const currentWindowStart = now - sevenDaysMs;
  const previousWindowStart = now - 2 * sevenDaysMs;

  const currentStalled = items.filter((item) => {
    const timestamp = parseSecurityTimestamp(item.investigationStalledAt);
    return timestamp != null && timestamp >= currentWindowStart;
  }).length;
  const previousStalled = items.filter((item) => {
    const timestamp = parseSecurityTimestamp(item.investigationStalledAt);
    return timestamp != null && timestamp >= previousWindowStart && timestamp < currentWindowStart;
  }).length;

  const currentTakeovers = items.filter((item) => {
    const timestamp = parseSecurityTimestamp(item.escalatedAt);
    return timestamp != null && timestamp >= currentWindowStart;
  }).length;
  const previousTakeovers = items.filter((item) => {
    const timestamp = parseSecurityTimestamp(item.escalatedAt);
    return timestamp != null && timestamp >= previousWindowStart && timestamp < currentWindowStart;
  }).length;

  return {
    stalledTrendLabel: formatWindowTrend(currentStalled, previousStalled, '7d vs prev 7d stalled'),
    stalledTrendDirection: resolveTrendDirection(currentStalled, previousStalled, true),
    takeoverTrendLabel: formatWindowTrend(currentTakeovers, previousTakeovers, '7d vs prev 7d takeovers'),
    takeoverTrendDirection: resolveTrendDirection(currentTakeovers, previousTakeovers, true),
  };
}

function buildSecurityTrendMetricsFromBackend(metrics: SecurityReviewMetrics) {
  return {
    stalledTrendLabel: formatWindowTrend(
      metrics.history.stalledLast7Days,
      metrics.history.stalledPrevious7Days,
      '7d vs prev 7d stalled',
    ),
    stalledTrendDirection: resolveTrendDirection(
      metrics.history.stalledLast7Days,
      metrics.history.stalledPrevious7Days,
      true,
    ),
    takeoverTrendLabel: formatWindowTrend(
      metrics.history.takeoversLast7Days,
      metrics.history.takeoversPrevious7Days,
      '7d vs prev 7d takeovers',
    ),
    takeoverTrendDirection: resolveTrendDirection(
      metrics.history.takeoversLast7Days,
      metrics.history.takeoversPrevious7Days,
      true,
    ),
  };
}

function formatCompatibilityAlertLabel(item?: AuditLogItem) {
  if (!item) {
    return 'n/a';
  }

  const detectedVersion =
    typeof item.after?.detectedContractVersion === 'string'
      ? item.after.detectedContractVersion
      : 'unknown';
  return `${detectedVersion} at ${formatCompactTimestamp(item.timestamp)}`;
}

function parseSecurityTimestamp(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function formatCompactTimestamp(value?: string) {
  if (!value) {
    return 'n/a';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatWindowTrend(current: number, previous: number, suffix: string) {
  const delta = current - previous;
  if (delta === 0) {
    return `Flat ${suffix}`;
  }

  const direction = delta > 0 ? '+' : '';
  return `${direction}${delta} ${suffix}`;
}

function resolveTrendDirection(
  current: number,
  previous: number,
  lowerIsBetter: boolean,
): 'up' | 'down' | 'neutral' {
  if (current === previous) {
    return 'neutral';
  }

  if (lowerIsBetter) {
    return current < previous ? 'up' : 'down';
  }

  return current > previous ? 'up' : 'down';
}

function resolveDemoApiBaseUrl() {
  const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  return ['127.0.0.1', 'localhost'].includes(window.location.hostname)
    ? 'http://127.0.0.1:4000'
    : '';
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

function ExecutiveSignalCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: 'primary' | 'teal' | 'warning';
}) {
  return (
    <article className={`executive-signal-card executive-signal-card-${tone}`}>
      <div className="executive-signal-card-top">
        <span className="eyebrow">{title}</span>
      </div>
      <strong>{value}</strong>
      <p className="muted">{detail}</p>
    </article>
  );
}

function CriticalActionCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: 'red' | 'orange';
}) {
  return (
    <article className={`critical-action-card ${tone}`}>
      <span className="eyebrow">{title}</span>
      <strong>{value}</strong>
      <p className="muted">{detail}</p>
    </article>
  );
}

function SectionPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-section-pill">
      <span>{label}</span>
      <strong>{value}</strong>
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

function buildLoanPipeline(pendingApprovals: number) {
  const submitted = Math.max(pendingApprovals + 80, 120);
  const branch = Math.max(Math.round(submitted * 0.66), 80);
  const district = Math.max(Math.round(submitted * 0.33), 40);
  const headOffice = Math.max(Math.round(submitted * 0.08), 10);
  const approved = Math.max(Math.round(submitted * 0.25), 30);

  return [
    { label: 'Submitted', value: submitted, width: 100, tone: 'primary' },
    { label: 'Branch', value: branch, width: Math.round((branch / submitted) * 100), tone: 'teal' },
    { label: 'District', value: district, width: Math.round((district / submitted) * 100), tone: 'warning' },
    { label: 'Head Office', value: headOffice, width: Math.round((headOffice / submitted) * 100), tone: 'accent' },
    { label: 'Approved', value: approved, width: Math.round((approved / submitted) * 100), tone: 'success' },
  ] as const;
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
