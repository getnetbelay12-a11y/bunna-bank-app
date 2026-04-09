import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  AuditLogItem,
  InsuranceAlertItem,
  NotificationCampaignItem,
  OnboardingReviewItem,
  SupportChatSummaryItem,
} from '../../core/api/contracts';
import type { AdminRole } from '../../core/session';
import { isKycAttention, isSupportAttention } from '../shared-layout/attentionRules';
import { renderPanelAction } from '../shared-layout/panelHelpers';
import { useAttentionView } from '../shared-layout/useAttentionView';
import { WatchlistPanelFrame } from '../shared-layout/WatchlistPanelFrame';

type OperationsSummaryPanelProps = {
  role: AdminRole;
  onOpenLoans?: () => void;
  onOpenSupport?: () => void;
  onOpenRisk?: () => void;
  onOpenAudit?: () => void;
};

export function OperationsSummaryPanel({
  role,
  onOpenLoans,
  onOpenSupport,
  onOpenRisk,
  onOpenAudit,
}: OperationsSummaryPanelProps) {
  const { auditApi, dashboardApi, loanMonitoringApi, notificationApi, supportApi } =
    useAppClient();
  const [loanCount, setLoanCount] = useState(0);
  const [supportItems, setSupportItems] = useState<SupportChatSummaryItem[]>([]);
  const [auditItems, setAuditItems] = useState<AuditLogItem[]>([]);
  const [kycItems, setKycItems] = useState<OnboardingReviewItem[]>([]);
  const [campaignItems, setCampaignItems] = useState<NotificationCampaignItem[]>([]);
  const [insuranceAlerts, setInsuranceAlerts] = useState<InsuranceAlertItem[]>([]);

  useEffect(() => {
    let active = true;

    void Promise.all([
      loanMonitoringApi?.getPendingLoans() ?? Promise.resolve([]),
      Promise.all([
        supportApi.getOpenChats(),
        supportApi.getAssignedChats(),
        supportApi.getResolvedChats(),
      ]),
      auditApi.getByEntity(role),
      dashboardApi.getOnboardingReviewQueue(role),
      notificationApi.getCampaigns(),
      notificationApi.getInsuranceAlerts(),
    ])
      .then(
        ([
          loans,
          supportResults,
          audits,
          onboardingReviews,
          campaigns,
          insurance,
        ]) => {
          if (!active) {
            return;
          }

          setLoanCount(loans.length);
          setSupportItems([...supportResults[0], ...supportResults[1], ...supportResults[2]]);
          setAuditItems(audits);
          setKycItems(onboardingReviews);
          setCampaignItems(campaigns);
          setInsuranceAlerts(insurance);
        },
      )
      .catch(() => {
        if (!active) {
          return;
        }

        setLoanCount(0);
        setSupportItems([]);
        setAuditItems([]);
        setKycItems([]);
        setCampaignItems([]);
        setInsuranceAlerts([]);
      });

    return () => {
      active = false;
    };
  }, [auditApi, dashboardApi, loanMonitoringApi, notificationApi, role, supportApi]);

  const supportPressure = useMemo(
    () => supportItems.filter(isSupportAttention).length,
    [supportItems],
  );
  const auditActionable = useMemo(
    () =>
      auditItems.filter(
        (item) =>
          item.entity.includes(':') ||
          item.entity.includes('loan_') ||
          item.entity.includes('member_') ||
          item.entity.toLowerCase().includes('chat') ||
          item.entity.toLowerCase().includes('autopay'),
      ).length,
    [auditItems],
  );
  const riskActionable = useMemo(() => {
    const kycNeedsAction = kycItems.filter(isKycAttention).length;
    const failedCampaigns = campaignItems.filter((item) => item.status === 'failed').length;
    const activeInsurance = insuranceAlerts.filter((item) => item.requiresManagerAction).length;
    const supportBacklog = supportItems.filter(isSupportAttention).length;

    return loanCount + kycNeedsAction + failedCampaigns + activeInsurance + supportBacklog;
  }, [campaignItems, insuranceAlerts, kycItems, loanCount, supportItems]);

  const trackedQueues = 4;
  const queueRows = useMemo(
    () => [
      {
        queue: 'Loans',
        currentLoad: `${loanCount.toLocaleString()} pending cases`,
        actionCue: loanCount > 0 ? 'Executive loan triage needed' : 'Queue under control',
        needsAttention: loanCount > 0,
        openLabel: 'Open loans',
        onOpen: onOpenLoans,
      },
      {
        queue: 'Support',
        currentLoad: `${supportPressure.toLocaleString()} active pressure items`,
        actionCue:
          supportPressure > 0
            ? 'Unread, escalated, or high-priority chats'
            : 'Queue under control',
        needsAttention: supportPressure > 0,
        openLabel: 'Open support',
        onOpen: onOpenSupport,
      },
      {
        queue: 'Risk',
        currentLoad: `${riskActionable.toLocaleString()} actionable signals`,
        actionCue:
          riskActionable > 0
            ? 'Composite operational pressure requires review'
            : 'No urgent risk pressure',
        needsAttention: riskActionable > 0,
        openLabel: 'Open risk',
        onOpen: onOpenRisk,
      },
      {
        queue: 'Audit',
        currentLoad: `${auditActionable.toLocaleString()} actionable events`,
        actionCue:
          auditActionable > 0
            ? 'Recent auditable actions can be routed directly'
            : 'Low direct audit workload',
        needsAttention: auditActionable > 0,
        openLabel: 'Open audit',
        onOpen: onOpenAudit,
      },
    ],
    [
      auditActionable,
      loanCount,
      onOpenAudit,
      onOpenLoans,
      onOpenRisk,
      onOpenSupport,
      riskActionable,
      supportPressure,
    ],
  );
  const needsAttentionRows = queueRows.filter((item) => item.needsAttention);
  const { activeView, activeViewLabel, filterOptions, setActiveView, visibleItems: visibleRows } =
    useAttentionView(queueRows, needsAttentionRows);

  return (
    <WatchlistPanelFrame
      title="Operations Summary"
      description="Head-office triage snapshot across the main operational queues."
      filterRow={
        <div className="loan-filter-row">
          {filterOptions.map((view) => (
            <button
              key={view.id}
              type="button"
              className={activeView === view.id ? 'loan-filter-chip active' : 'loan-filter-chip'}
              onClick={() => setActiveView(view.id)}
            >
              {view.label}
            </button>
          ))}
        </div>
      }
      summaryChips={[
        { label: 'Current focus', value: activeViewLabel },
        { label: 'Tracked queues', value: trackedQueues },
        { label: 'Loan queue', value: loanCount.toLocaleString() },
        { label: 'Support pressure', value: supportPressure.toLocaleString() },
        { label: 'Risk actionables', value: riskActionable.toLocaleString() },
        { label: 'Audit actionables', value: auditActionable.toLocaleString() },
      ]}
      tableHeaders={['Queue', 'Current load', 'Recommended next step', 'Open workspace']}
      tableRows={visibleRows.map((item) => [
        item.queue,
        item.currentLoad,
        item.actionCue,
        renderPanelAction(item.openLabel, item.onOpen),
      ])}
      emptyState={{
        title: 'No urgent institution queues',
        description: 'Head office has no active cross-queue pressure in the current filter.',
      }}
    />
  );
}
