import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  InsuranceAlertItem,
  NotificationCategory,
  NotificationCampaignItem,
  NotificationLogItem,
} from '../../core/api/contracts';
import { isNotificationFailure } from '../shared-layout/attentionRules';
import { renderPanelAction } from '../shared-layout/panelHelpers';
import { useAttentionView } from '../shared-layout/useAttentionView';
import { WatchlistPanelFrame } from '../shared-layout/WatchlistPanelFrame';

type NotificationWatchlistPanelProps = {
  title: string;
  description: string;
  onOpenCategory?: (category: NotificationCategory) => void;
};

export function NotificationWatchlistPanel({
  title,
  description,
  onOpenCategory,
}: NotificationWatchlistPanelProps) {
  const { notificationApi } = useAppClient();
  const [campaigns, setCampaigns] = useState<NotificationCampaignItem[]>([]);
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [alerts, setAlerts] = useState<InsuranceAlertItem[]>([]);

  useEffect(() => {
    let active = true;

    void Promise.all([
      notificationApi.getCampaigns(),
      notificationApi.getLogs(),
      notificationApi.getInsuranceAlerts(),
    ])
      .then(([campaignsResult, logsResult, alertsResult]) => {
        if (!active) {
          return;
        }

        setCampaigns(campaignsResult);
        setLogs(logsResult);
        setAlerts(alertsResult);
      })
      .catch(() => {
        if (active) {
          setCampaigns([]);
          setLogs([]);
          setAlerts([]);
        }
      });

    return () => {
      active = false;
    };
  }, [notificationApi]);

  const failedLogs = useMemo(
    () => logs.filter((item) => item.status === 'failed'),
    [logs],
  );
  const loanCampaigns = useMemo(
    () => campaigns.filter((item) => item.category === 'loan'),
    [campaigns],
  );
  const insuranceCampaigns = useMemo(
    () => campaigns.filter((item) => item.category === 'insurance'),
    [campaigns],
  );
  const kycCampaigns = useMemo(
    () => campaigns.filter((item) => item.category === 'kyc'),
    [campaigns],
  );
  const autopayCampaigns = useMemo(
    () => campaigns.filter((item) => item.category === 'autopay'),
    [campaigns],
  );
  const loanRows = useMemo(
    () =>
      [
        {
          category: 'loan' as const,
          label: 'Loan reminders',
          activeCount: loanCampaigns.filter((item) => item.status !== 'completed').length,
          failedCount: campaigns.filter(
            (item) => item.category === 'loan' && isNotificationFailure(item),
          ).length,
          actionCue:
            failedLogs.some((item) => item.category === 'loan')
              ? 'Delivery failures need review'
              : 'Ready for reminder follow-up',
        },
        {
          category: 'insurance' as const,
          label: 'Insurance reminders',
          activeCount: insuranceCampaigns.filter((item) => item.status !== 'completed').length,
          failedCount: campaigns.filter(
            (item) => item.category === 'insurance' && isNotificationFailure(item),
          ).length,
          actionCue:
            alerts.length > 0
              ? `${alerts.length} insurance alert${alerts.length === 1 ? '' : 's'}`
              : 'No open insurance alert',
        },
        {
          category: 'kyc' as const,
          label: 'KYC reminders',
          activeCount: kycCampaigns.filter((item) => item.status !== 'completed').length,
          failedCount: campaigns.filter(
            (item) => item.category === 'kyc' && isNotificationFailure(item),
          ).length,
          actionCue:
            failedLogs.some((item) => item.category === 'kyc')
              ? 'KYC reminder failures need review'
              : 'Ready for onboarding follow-up',
        },
        {
          category: 'autopay' as const,
          label: 'AutoPay reminders',
          activeCount: autopayCampaigns.filter((item) => item.status !== 'completed').length,
          failedCount: campaigns.filter(
            (item) => item.category === 'autopay' && isNotificationFailure(item),
          ).length,
          actionCue:
            failedLogs.some((item) => item.category === 'autopay')
              ? 'AutoPay reminder failures need review'
            : 'Ready for standing-instruction follow-up',
        },
      ],
    [
      alerts.length,
      autopayCampaigns,
      campaigns,
      failedLogs,
      insuranceCampaigns,
      kycCampaigns,
      loanCampaigns,
    ],
  );
  const needsAttentionRows = useMemo(
    () =>
      loanRows.filter(
        (item) =>
          item.failedCount > 0 || (item.category === 'insurance' && alerts.length > 0),
      ),
    [alerts.length, loanRows],
  );
  const { activeView, activeViewLabel, filterOptions, setActiveView, visibleItems: visibleRows } =
    useAttentionView(loanRows, needsAttentionRows);

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
        {
          label: 'Active loan campaigns',
          value: loanCampaigns.filter((item) => item.status !== 'completed').length.toLocaleString(),
        },
        {
          label: 'Active insurance campaigns',
          value: insuranceCampaigns
            .filter((item) => item.status !== 'completed')
            .length.toLocaleString(),
        },
        { label: 'Delivery failures', value: failedLogs.length.toLocaleString() },
        { label: 'Insurance alerts', value: alerts.length.toLocaleString() },
        {
          label: 'Active KYC campaigns',
          value: kycCampaigns.filter((item) => item.status !== 'completed').length.toLocaleString(),
        },
        {
          label: 'Active AutoPay campaigns',
          value: autopayCampaigns
            .filter((item) => item.status !== 'completed')
            .length.toLocaleString(),
        },
      ]}
      tableHeaders={['Category', 'Open workload', 'Failures', 'Recommended next step', 'Open workspace']}
      tableRows={visibleRows.map((item) => [
        item.label,
        item.activeCount.toLocaleString(),
        item.failedCount.toLocaleString(),
        item.actionCue,
        renderPanelAction(
          `Open ${item.label}`,
          onOpenCategory ? () => onOpenCategory(item.category) : undefined,
        ),
      ])}
      emptyState={{
        title: 'No urgent reminder campaigns',
        description: 'This notification view has no active delivery pressure or reminder follow-up.',
      }}
    />
  );
}
