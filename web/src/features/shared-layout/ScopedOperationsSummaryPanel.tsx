import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  InsuranceAlertItem,
  NotificationCampaignItem,
  NotificationCategory,
  OnboardingReviewItem,
  SupportChatSummaryItem,
} from '../../core/api/contracts';
import type { AdminRole } from '../../core/session';
import { isKycAttention, isSupportAttention } from './attentionRules';
import { renderPanelAction } from './panelHelpers';
import { useAttentionView } from './useAttentionView';
import { WatchlistPanelFrame } from './WatchlistPanelFrame';

type ScopedOperationsSummaryPanelProps = {
  role: AdminRole;
  title: string;
  description: string;
  onOpenLoan?: (loanId: string) => void;
  onOpenSupportChat?: (conversationId: string) => void;
  onOpenKycMember?: (memberId: string) => void;
  onOpenAutopayOperation?: (operationId: string) => void;
  onOpenNotificationCategory?: (category: NotificationCategory) => void;
};

export function ScopedOperationsSummaryPanel({
  role,
  title,
  description,
  onOpenLoan,
  onOpenSupportChat,
  onOpenKycMember,
  onOpenAutopayOperation,
  onOpenNotificationCategory,
}: ScopedOperationsSummaryPanelProps) {
  const { dashboardApi, loanMonitoringApi, notificationApi, supportApi } = useAppClient();
  const [loanIds, setLoanIds] = useState<string[]>([]);
  const [supportItems, setSupportItems] = useState<SupportChatSummaryItem[]>([]);
  const [kycItems, setKycItems] = useState<OnboardingReviewItem[]>([]);
  const [campaignItems, setCampaignItems] = useState<NotificationCampaignItem[]>([]);
  const [insuranceAlerts, setInsuranceAlerts] = useState<InsuranceAlertItem[]>([]);
  const [autopayOperationIds, setAutopayOperationIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    void Promise.all([
      loanMonitoringApi?.getPendingLoans() ?? Promise.resolve([]),
      Promise.all([
        supportApi.getOpenChats(),
        supportApi.getAssignedChats(),
        supportApi.getResolvedChats(),
      ]),
      dashboardApi.getOnboardingReviewQueue(role),
      notificationApi.getCampaigns(),
      notificationApi.getInsuranceAlerts(),
      dashboardApi.getAutopayOperations(role),
    ])
      .then(
        ([
          loans,
          supportResults,
          onboardingReviews,
          campaigns,
          insurance,
          autopayOperations,
        ]) => {
          if (!active) {
            return;
          }

          setLoanIds(loans.map((item) => item.loanId));
          setSupportItems([...supportResults[0], ...supportResults[1], ...supportResults[2]]);
          setKycItems(onboardingReviews);
          setCampaignItems(campaigns);
          setInsuranceAlerts(insurance);
          setAutopayOperationIds(autopayOperations.map((item) => item.id));
        },
      )
      .catch(() => {
        if (!active) {
          return;
        }

        setLoanIds([]);
        setSupportItems([]);
        setKycItems([]);
        setCampaignItems([]);
        setInsuranceAlerts([]);
        setAutopayOperationIds([]);
      });

    return () => {
      active = false;
    };
  }, [dashboardApi, loanMonitoringApi, notificationApi, role, supportApi]);

  const supportPressure = useMemo(
    () => supportItems.filter(isSupportAttention),
    [supportItems],
  );
  const kycPressure = useMemo(
    () => kycItems.filter(isKycAttention),
    [kycItems],
  );
  const reminderPressure = useMemo(
    () =>
      campaignItems.filter((item) => item.status === 'failed').length +
      insuranceAlerts.filter((item) => item.requiresManagerAction).length,
    [campaignItems, insuranceAlerts],
  );

  const queueRows = useMemo(
    () => [
      {
        queue: 'Loans',
        currentLoad: `${loanIds.length.toLocaleString()} pending cases`,
        actionCue: loanIds.length > 0 ? 'Loan review queue needs handling' : 'Queue under control',
        needsAttention: loanIds.length > 0,
        openLabel: 'Open loans',
        onOpen: loanIds[0] && onOpenLoan ? () => onOpenLoan(loanIds[0]) : undefined,
      },
      {
        queue: 'Support',
        currentLoad: `${supportPressure.length.toLocaleString()} active pressure items`,
        actionCue:
          supportPressure.length > 0
            ? 'Unread, escalated, or high-priority chats'
            : 'Queue under control',
        needsAttention: supportPressure.length > 0,
        openLabel: 'Open support',
        onOpen:
          supportPressure[0] && onOpenSupportChat
            ? () => onOpenSupportChat(supportPressure[0].conversationId)
            : undefined,
      },
      {
        queue: 'KYC',
        currentLoad: `${kycPressure.length.toLocaleString()} review cases`,
        actionCue:
          kycPressure.length > 0
            ? 'Onboarding review or correction work is active'
            : 'Queue under control',
        needsAttention: kycPressure.length > 0,
        openLabel: 'Open KYC',
        onOpen:
          kycPressure[0] && onOpenKycMember
            ? () => onOpenKycMember(kycPressure[0].memberId)
            : undefined,
      },
      {
        queue: 'AutoPay',
        currentLoad: `${autopayOperationIds.length.toLocaleString()} tracked instructions`,
        actionCue:
          autopayOperationIds.length > 0
            ? 'Standing instructions need monitoring or follow-up'
            : 'Queue under control',
        needsAttention: autopayOperationIds.length > 0,
        openLabel: 'Open AutoPay',
        onOpen:
          autopayOperationIds[0] && onOpenAutopayOperation
            ? () => onOpenAutopayOperation(autopayOperationIds[0])
            : undefined,
      },
      {
        queue: 'Notifications',
        currentLoad: `${reminderPressure.toLocaleString()} reminder exceptions`,
        actionCue:
          reminderPressure > 0
            ? 'Delivery failures or insurance reminders need review'
            : 'Queue under control',
        needsAttention: reminderPressure > 0,
        openLabel: 'Open notifications',
        onOpen:
          reminderPressure > 0 && onOpenNotificationCategory
            ? () => onOpenNotificationCategory('loan')
            : undefined,
      },
    ],
    [
      autopayOperationIds,
      kycPressure,
      loanIds,
      onOpenAutopayOperation,
      onOpenKycMember,
      onOpenLoan,
      onOpenNotificationCategory,
      onOpenSupportChat,
      reminderPressure,
      supportPressure,
    ],
  );
  const needsAttentionRows = queueRows.filter((item) => item.needsAttention);
  const { activeView, activeViewLabel, filterOptions, setActiveView, visibleItems: visibleRows } =
    useAttentionView(queueRows, needsAttentionRows);

  return (
    <WatchlistPanelFrame
      title={title}
      description={description}
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
        { label: 'Loan queue', value: loanIds.length.toLocaleString() },
        { label: 'Support pressure', value: supportPressure.length.toLocaleString() },
        { label: 'KYC pressure', value: kycPressure.length.toLocaleString() },
        { label: 'AutoPay tracked', value: autopayOperationIds.length.toLocaleString() },
        { label: 'Reminder exceptions', value: reminderPressure.toLocaleString() },
      ]}
      tableHeaders={['Queue', 'Current load', 'Recommended next step', 'Open workspace']}
      tableRows={visibleRows.map((item) => [
        item.queue,
        item.currentLoad,
        item.actionCue,
        renderPanelAction(item.openLabel, item.onOpen),
      ])}
      emptyState={{
        title: 'No active scoped queues',
        description: 'This role currently has no urgent branch or district operational pressure.',
      }}
    />
  );
}
