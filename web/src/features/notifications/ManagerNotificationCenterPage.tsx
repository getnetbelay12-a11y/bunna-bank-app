import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  CreateManagerNotificationCampaignPayload,
  InsuranceAlertItem,
  NotificationCategory,
  NotificationCenterItem,
  NotificationCampaignItem,
  NotificationLogItem,
  NotificationTemplateItem,
} from '../../core/api/contracts';
import { getManagerConsoleKind, type AdminSession } from '../../core/session';
import { ConsoleKpiStrip } from '../../shared/components/ConsoleKpiStrip';
import { CriticalActionStrip } from '../../shared/components/CriticalActionStrip';
import {
  DashboardGrid,
  DashboardMetricRow,
  DashboardPage,
  DashboardSectionCard,
  DashboardTableCard,
  QuickActionChip,
} from '../../shared/components/BankingDashboard';

import { AMHARA_LOGO_DATA_URL } from './amharaLogoData';

type ManagerNotificationCenterPageProps = {
  session: AdminSession;
  initialCategory?: NotificationCategory;
  returnContextLabel?: string;
  onReturnToContext?: () => void;
  onOpenPaymentReceipts?: (target: {
    memberId?: string;
    filter: 'all' | 'qr_payment' | 'school_payment' | 'payment_dispute' | 'failed_transfer';
  }) => void;
};

const allChannels = ['mobile_push', 'email', 'sms', 'telegram'] as const;
const localDemoRecipient = 'write2get@gmail.com';
const defaultTemplateTypeByCategory = {
  loan: 'loan_due_soon',
  insurance: 'insurance_renewal_reminder',
  payment: 'school_payment_due',
  support: 'support_reply',
  security: 'login_detected',
  system: 'announcement',
  kyc: 'kyc_pending_reminder',
  autopay: 'autopay_failure_reminder',
  shareholder: 'shareholder_vote',
} as const;

export function ManagerNotificationCenterPage({
  session,
  initialCategory,
  returnContextLabel,
  onReturnToContext,
  onOpenPaymentReceipts,
}: ManagerNotificationCenterPageProps) {
  const { notificationApi } = useAppClient();
  const [recentNotifications, setRecentNotifications] = useState<NotificationCenterItem[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [campaigns, setCampaigns] = useState<NotificationCampaignItem[]>([]);
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [alerts, setAlerts] = useState<InsuranceAlertItem[]>([]);
  const [category, setCategory] = useState<NotificationCategory>(initialCategory ?? 'loan');
  const [templateType, setTemplateType] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['mobile_push']);
  const [targetType, setTargetType] = useState<
    'single_customer' | 'selected_customers' | 'filtered_customers'
  >('filtered_customers');
  const [targetIds, setTargetIds] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [latestSummary, setLatestSummary] = useState<NotificationCampaignItem['deliverySummary'] | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      notificationApi.getNotifications(session.role),
      notificationApi.getTemplates(),
      notificationApi.getCampaigns(),
      notificationApi.getLogs(),
      notificationApi.getInsuranceAlerts(),
    ]).then(([notificationsResult, templatesResult, campaignsResult, logsResult, alertsResult]) => {
      if (cancelled) {
        return;
      }

      setRecentNotifications(notificationsResult);
      setTemplates(templatesResult);
      setCampaigns(campaignsResult);
      setLogs(logsResult);
      setAlerts(alertsResult);

      const initialTemplate = templatesResult.find((item) => item.templateType === defaultTemplateTypeByCategory.loan);
      if (initialTemplate) {
        setTemplateType(initialTemplate.templateType);
        setSubject(initialTemplate.subject ?? initialTemplate.title);
        setMessageBody(initialTemplate.messageBody);
        setSelectedChannels(initialTemplate.channelDefaults);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [notificationApi, session.role]);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  const filteredTemplates = useMemo(
    () => templates.filter((item) => item.category === category),
    [category, templates],
  );
  const selectedTemplate = useMemo(
    () => filteredTemplates.find((item) => item.templateType === templateType) ?? null,
    [filteredTemplates, templateType],
  );
  const previewModel = useMemo(
    () => buildReminderPreview(category, subject, messageBody),
    [category, subject, messageBody],
  );
  const previewHeading =
    category === 'loan'
      ? 'Loan Reminder Preview'
      : category === 'insurance'
        ? 'Insurance Renewal Preview'
        : category === 'payment'
          ? 'Payment Alert Preview'
          : category === 'support'
            ? 'Support Alert Preview'
            : category === 'security'
              ? 'Security Alert Preview'
              : category === 'system'
                ? 'System Announcement Preview'
        : category === 'kyc'
          ? 'KYC Reminder Preview'
          : category === 'shareholder'
            ? 'Shareholder Update Preview'
            : 'AutoPay Reminder Preview';
  const previewCaption =
    category === 'loan'
      ? 'Bunna Bank loan reminder preview for linked customer channels.'
      : category === 'insurance'
        ? 'Bunna Bank insurance renewal reminder preview for linked customer channels.'
        : category === 'payment'
          ? 'Bunna Bank payment alert preview for linked customer channels.'
          : category === 'support'
            ? 'Bunna Bank support alert preview for linked customer channels.'
            : category === 'security'
              ? 'Bunna Bank security alert preview for linked customer channels.'
              : category === 'system'
                ? 'Bunna Bank system announcement preview for linked customer channels.'
        : category === 'kyc'
          ? 'Bunna Bank KYC reminder preview for linked customer channels.'
          : category === 'shareholder'
            ? 'Bunna Bank shareholder governance preview for eligible members.'
            : 'Bunna Bank AutoPay failure reminder preview for linked customer channels.';
  const telegramPreview = useMemo(
    () => buildTelegramPreview(category),
    [category],
  );

  useEffect(() => {
    const nextTemplate =
      filteredTemplates.find((item) => item.templateType === defaultTemplateTypeByCategory[category]) ??
      filteredTemplates[0];
    if (!nextTemplate) {
      return;
    }

    setTemplateType(nextTemplate.templateType);
    setSubject(nextTemplate.subject ?? nextTemplate.title);
    setMessageBody(nextTemplate.messageBody);
    setSelectedChannels(nextTemplate.channelDefaults);
  }, [category, filteredTemplates]);

  const scopeLabel = useMemo(() => {
    const consoleKind = getManagerConsoleKind(session.role);

    if (consoleKind === 'branch') {
      return `Restricted to ${session.branchName}`;
    }

    if (consoleKind === 'district') {
      return `Restricted to ${session.districtName ?? 'Assigned district'}`;
    }

    return 'Institution-wide reminder scope';
  }, [session]);
  const alertsNeedingAction = alerts.filter((item) => item.requiresManagerAction).length;

  async function handleSend() {
    const resolvedTemplateType =
      templateType || defaultTemplateTypeByCategory[category];

    const normalizedChannels =
      selectedChannels.length === 0 ? ['email'] : selectedChannels;

    const payload: CreateManagerNotificationCampaignPayload = {
      category,
      templateType: resolvedTemplateType,
      channels:
        normalizedChannels as CreateManagerNotificationCampaignPayload['channels'],
      targetType,
      targetIds:
        targetType === 'filtered_customers'
          ? undefined
          : targetIds
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean),
      filters: targetType === 'filtered_customers' ? buildFilters(session) : undefined,
      messageSubject: subject,
      messageBody,
      demoRecipientEmail: localDemoRecipient,
    };

    try {
      setIsSending(true);
      setFormError('');
      setTemplateType(resolvedTemplateType);
      setSelectedChannels(normalizedChannels);
      const campaign = await notificationApi.createCampaign(payload);
      const sentCampaign = await notificationApi.sendCampaign(campaign.id);
      setLatestSummary(sentCampaign.deliverySummary ?? null);
      setFormSuccess(formatCampaignSuccess(sentCampaign));

      try {
        const [campaignsResult, logsResult] = await Promise.all([
          notificationApi.getCampaigns(),
          notificationApi.getLogs(sentCampaign.id),
        ]);

        setCampaigns(campaignsResult);
        setLogs(logsResult);
      } catch (refreshError) {
        console.warn('Reminder sent but campaign refresh failed.', refreshError);
      }
    } catch (error) {
      setLatestSummary(null);
      setFormSuccess('');
      setFormError(
        error instanceof Error
          ? error.message
          : 'Failed to send the reminder campaign.',
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <DashboardPage>
      <div className="console-focus-page notifications-page">
        {returnContextLabel && onReturnToContext ? (
          <div className="loan-return-banner">
            <div>
              <strong>Opened from {returnContextLabel}</strong>
              <span>Return to your dashboard context without losing the notification handoff.</span>
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

        <section className="console-command-grid">
          <article className="console-command-card console-command-card-primary">
            <div className="console-command-copy">
              <span className="eyebrow">Notification command</span>
              <h3>Run reminders like a banking operations desk with clean previews, visible delivery pressure, and focused campaign scope.</h3>
              <p>Keep communication action-first instead of forcing staff through long setup blocks before they understand queue health.</p>
            </div>
            <div className="console-command-stats">
              <div>
                <span>Campaigns</span>
                <strong>{campaigns.length.toLocaleString()}</strong>
              </div>
              <div>
                <span>Recipients</span>
                <strong>{recentNotifications.length.toLocaleString()}</strong>
              </div>
              <div>
                <span>Insurance alerts</span>
                <strong>{alertsNeedingAction.toLocaleString()}</strong>
              </div>
              <div>
                <span>Scope</span>
                <strong>{scopeLabel}</strong>
              </div>
            </div>
          </article>

          <article className="console-command-card console-command-card-warning">
            <span className="eyebrow">Priority signals</span>
            <h3>Delivery pressure</h3>
            <ul className="console-priority-list">
              <li>
                <span>Loan reminders</span>
                <strong>{recentNotifications.filter((item) => item.type.includes('loan')).length.toLocaleString()} recent loan-related notifications are in circulation.</strong>
              </li>
              <li>
                <span>Failures</span>
                <strong>{logs.filter((item) => item.status === 'failed').length.toLocaleString()} delivery attempts have failed and need review.</strong>
              </li>
              <li>
                <span>Insurance action</span>
                <strong>{alertsNeedingAction.toLocaleString()} members need insurance-linked reminder follow-up.</strong>
              </li>
            </ul>
          </article>

          <article className="console-command-card console-command-card-secondary">
            <span className="eyebrow">Execution snapshot</span>
            <h3>What managers should do</h3>
            <ol className="console-action-ladder">
              <li>
                <div>
                  <strong>{campaigns.filter((item) => item.status === 'draft').length.toLocaleString()} draft campaigns</strong>
                  <p>Finalize priority drafts before building more message batches.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>{campaigns.filter((item) => item.channels.includes('mobile_push')).length.toLocaleString()} push campaigns</strong>
                  <p>Use in-app delivery first for time-sensitive nudges and workflow reminders.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>{campaigns.filter((item) => item.category === 'payment').length.toLocaleString()} payment reminders</strong>
                  <p>Keep school and payment campaigns visible because they drive the strongest demo flow.</p>
                </div>
              </li>
            </ol>
          </article>
        </section>

        <ConsoleKpiStrip
        items={[
          { icon: 'CU', label: 'Customers', value: recentNotifications.length.toLocaleString(), trend: 'Recipients in scope', trendDirection: 'neutral' },
          { icon: 'LN', label: 'Loans', value: campaigns.filter((item) => item.category === 'loan').length.toLocaleString(), trend: 'Loan campaigns', trendDirection: 'up' },
          { icon: 'SV', label: 'Savings', value: campaigns.filter((item) => item.category === 'payment').length.toLocaleString(), trend: 'Payment reminders', trendDirection: 'up' },
          { icon: 'AP', label: 'Approvals', value: campaigns.filter((item) => item.status === 'draft').length.toLocaleString(), trend: 'Draft campaigns', trendDirection: 'neutral' },
          { icon: 'AL', label: 'Alerts', value: alertsNeedingAction.toLocaleString(), trend: 'Insurance action', trendDirection: 'down' },
        ]}
      />
      <CriticalActionStrip
        items={[
          { label: 'Overdue Loans', value: recentNotifications.filter((item) => item.type.includes('loan')).length.toLocaleString(), tone: 'red' },
          { label: 'Missing Documents', value: recentNotifications.filter((item) => item.type.includes('kyc')).length.toLocaleString(), tone: 'orange' },
          { label: 'Support Backlog', value: recentNotifications.filter((item) => item.type.includes('support')).length.toLocaleString(), tone: 'red' },
          { label: 'Expiring Insurance', value: alertsNeedingAction.toLocaleString(), tone: 'amber' },
        ]}
      />

      <DashboardGrid>
        <DashboardSectionCard
          title="Create Reminder Campaign"
          description="Choose category, template, channels, target scope, preview, and send."
          className="panel"
          action={<QuickActionChip label={scopeLabel} />}
        >
          <div className="notification-builder-grid">
            <section className="notification-builder-section">
              <div className="notification-builder-header">
                <span className="eyebrow">Campaign setup</span>
                <h3>Template and audience</h3>
              </div>
              <div className="form-grid">
                <label className="field-stack">
                  <span>Category</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value as NotificationCategory)}>
                    <option value="loan">Loan</option>
                    <option value="insurance">Insurance</option>
                    <option value="payment">Payment</option>
                    <option value="support">Support</option>
                    <option value="security">Security</option>
                    <option value="system">System</option>
                    <option value="kyc">KYC</option>
                    <option value="autopay">AutoPay</option>
                    <option value="shareholder">Shareholder</option>
                  </select>
                </label>

                <label className="field-stack">
                  <span>Template</span>
                  <select
                    value={templateType}
                    onChange={(event) => {
                      const selected = filteredTemplates.find(
                        (item) => item.templateType === event.target.value,
                      );
                      setTemplateType(event.target.value);
                      if (selected) {
                        setSubject(selected.subject ?? selected.title);
                        setMessageBody(selected.messageBody);
                        setSelectedChannels(selected.channelDefaults);
                      }
                    }}
                  >
                    {filteredTemplates.map((item) => (
                      <option key={item.id} value={item.templateType}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-stack">
                  <span>Target Type</span>
                  <select
                    value={targetType}
                    onChange={(event) =>
                      setTargetType(
                        event.target.value as
                          | 'single_customer'
                          | 'selected_customers'
                          | 'filtered_customers',
                      )
                    }
                  >
                    <option value="single_customer">Single customer</option>
                    <option value="selected_customers">Selected customers</option>
                    <option value="filtered_customers">Filtered customers</option>
                  </select>
                </label>

                <label className="field-stack">
                  <span>Target IDs</span>
                  <input
                    placeholder="BUN-100001, BUN-100003"
                    value={targetIds}
                    onChange={(event) => setTargetIds(event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="notification-builder-section notification-builder-section-muted">
              <div className="notification-builder-header">
                <span className="eyebrow">Delivery channels</span>
                <h3>Choose where the reminder goes</h3>
              </div>
              <div className="channel-row">
                {allChannels.map((channel) => (
                  <button
                    key={channel}
                    className={
                      selectedChannels.includes(channel)
                        ? 'channel-chip active'
                        : 'channel-chip'
                    }
                    onClick={() =>
                      setSelectedChannels((current) =>
                        current.includes(channel)
                          ? current.filter((item) => item !== channel)
                          : [...current, channel],
                      )
                    }
                    type="button"
                  >
                    {formatLabel(channel)}
                  </button>
                ))}
              </div>
              <div className="notification-helper-copy">
                <p>
                  Local email testing uses <strong>{localDemoRecipient}</strong> as the
                  sample reminder recipient whenever Email is selected.
                </p>
                <p>
                  Telegram reminders are sent only to customers who have connected the
                  Bunna Bank Telegram bot. Customers without Telegram linkage are skipped
                  for Telegram delivery.
                </p>
              </div>
            </section>
          </div>

          <section className="notification-builder-section">
            <div className="notification-builder-header">
              <span className="eyebrow">Message copy</span>
              <h3>Reminder content</h3>
            </div>
            <div className="form-grid">
              <label className="field-stack field-span">
                <span>Subject</span>
                <input value={subject} onChange={(event) => setSubject(event.target.value)} />
              </label>

              <label className="field-stack field-span">
                <span>Intro / Body Note</span>
                <textarea
                  rows={5}
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="notification-builder-section notification-builder-preview">
            <div>
              <strong>{previewHeading}</strong>
              <p className="muted" style={{ marginTop: 8 }}>
                {previewCaption}
              </p>
            </div>
            <div className="support-detail-meta">
              <button
                type="button"
                className={category === 'loan' ? 'channel-chip active' : 'channel-chip'}
                onClick={() => setCategory('loan')}
              >
                Loan Preview
              </button>
              <button
                type="button"
                className={category === 'insurance' ? 'channel-chip active' : 'channel-chip'}
                onClick={() => setCategory('insurance')}
              >
                Insurance Preview
              </button>
              <span className="badge badge-info">
                {selectedTemplate ? selectedTemplate.title : 'Select template'}
              </span>
              <span className="badge">Email test recipient: {localDemoRecipient}</span>
            </div>
            <ReminderEmailPreview model={previewModel} />
            {selectedChannels.includes('telegram') ? (
              <div style={{ marginTop: 18 }}>
                <TelegramReminderPreview message={telegramPreview} />
              </div>
            ) : null}
          </section>

          {formError ? <p className="muted" style={{ color: '#b42318' }}>{formError}</p> : null}
          {formSuccess ? <p className="muted" style={{ color: '#027a48' }}>{formSuccess}</p> : null}
          {latestSummary ? <CampaignDeliverySummary summary={latestSummary} /> : null}

          <div className="action-row">
            <span className={`pill-badge ${category === 'loan' ? 'loan' : 'insurance'}`}>
              {formatLabel(category)}
            </span>
            <button
              onClick={() => void handleSend()}
              type="button"
              disabled={isSending}
            >
              {isSending ? 'Sending Reminder...' : 'Send Reminder'}
            </button>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Notification Overview"
          description="Delivery health, insurance pressure, and reminder workload."
        >
          <div className="flex flex-col gap-3">
            <DashboardMetricRow
              label="Push Sent Today"
              value={campaigns.filter((item) => item.channels.includes('mobile_push')).length.toLocaleString()}
              note="Campaigns using in-app delivery"
            />
            <DashboardMetricRow
              label="Email Sent Today"
              value={campaigns.filter((item) => item.channels.includes('email')).length.toLocaleString()}
              note={`${logs.filter((item) => item.status === 'failed').length.toLocaleString()} failed deliveries`}
            />
            <DashboardMetricRow
              label="Insurance Alerts"
              value={alertsNeedingAction.toLocaleString()}
              note={`${alerts.length.toLocaleString()} total insurance cases`}
            />
          </div>
        </DashboardSectionCard>
      </DashboardGrid>

      <DashboardGrid>
        <DashboardTableCard
          title="Recent Notification Activity"
          description="Latest sent alerts with workflow jump actions."
          headers={['Type', 'Recipient', 'Status', 'Sent', 'Action']}
          rows={recentNotifications.map((item) => [
            <span className="table-status-badge neutral" key={`${item.userId}-${item.sentAt}-${item.type}`}>
              {formatLabel(item.type)}
            </span>,
            item.userLabel,
            <span
              className={`table-status-badge ${
                item.status === 'failed'
                  ? 'critical'
                  : item.status === 'pending'
                    ? 'warning'
                    : 'positive'
              }`}
            >
              {formatLabel(item.status)}
            </span>,
            item.sentAt,
            renderNotificationAction(item, onOpenPaymentReceipts),
          ])}
        />

        <DashboardTableCard
          title="Insurance Alerts"
          description="Expiring, expired, and missing loan-linked insurance coverage."
          headers={['Customer', 'Alert', 'Policy', 'Action']}
          rows={alerts.map((item) => [
            `${item.memberName} (${item.customerId})`,
            <span
              className={`table-status-badge ${
                item.requiresManagerAction ? 'critical' : 'warning'
              }`}
            >
              {formatLabel(item.alertType)}
            </span>,
            item.policyNumber ?? 'No linked policy',
            <span className={`table-status-badge ${item.requiresManagerAction ? 'critical' : 'neutral'}`}>
              {item.requiresManagerAction ? 'Review now' : 'Monitor'}
            </span>,
          ])}
        />
      </DashboardGrid>

      <DashboardGrid>
        <DashboardTableCard
          title="Campaigns"
          description="Manual reminder campaigns with current send state."
          headers={['Category', 'Template', 'Channels', 'Status']}
          rows={campaigns.map((item) => [
            <span className="table-status-badge neutral">{formatLabel(item.category)}</span>,
            formatLabel(item.templateType),
            <span className="table-chip-group">
              {item.channels.map((channel) => (
                <span key={`${item.id}-${channel}`} className="table-chip">
                  {formatLabel(channel)}
                </span>
              ))}
            </span>,
            <span
              className={`table-status-badge ${
                item.status === 'completed'
                  ? 'positive'
                  : item.status === 'draft'
                    ? 'neutral'
                    : item.status === 'failed'
                      ? 'critical'
                      : 'warning'
              }`}
            >
              {formatLabel(item.status)}
            </span>,
          ])}
        />

        <DashboardTableCard
          title="Delivery Logs"
          description="Per-recipient delivery result tracking across channels."
          headers={['Channel', 'Recipient', 'Status', 'Error']}
          rows={logs.map((item) => [
            <span className="table-chip">{formatLabel(item.channel)}</span>,
            item.recipient,
            <span
              className={`table-status-badge ${
                item.status === 'delivered'
                  ? 'positive'
                  : item.status === 'failed'
                    ? 'critical'
                    : item.status === 'sent'
                      ? 'neutral'
                      : 'warning'
              }`}
            >
              {formatLabel(item.status)}
            </span>,
            item.errorMessage ? <span className="table-status-badge critical subtle">{item.errorMessage}</span> : 'No error',
          ])}
        />
      </DashboardGrid>
      </div>
    </DashboardPage>
  );
}

function CampaignDeliverySummary({ summary }: { summary: NonNullable<NotificationCampaignItem['deliverySummary']> }) {
  return (
    <div
      style={{
        marginTop: 14,
        border: '1px solid #d7e2e5',
        borderRadius: 18,
        background: '#eef4f5',
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 700, color: '#103244', marginBottom: 8 }}>Campaign Results</div>
      <div className="muted" style={{ marginBottom: 12 }}>
        Targets: {summary.totalTargets} | Channels: {summary.totalChannels} | Attempts: {summary.totalAttempts}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {Object.entries(summary.channels).map(([channel, stats]) => (
          <div key={channel} style={{ color: '#243844' }}>
            <strong>{formatLabel(channel)}:</strong> {stats.sent} sent, {stats.delivered} delivered, {stats.skipped} skipped, {stats.failed} failed
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        {summary.perRecipientResults.map((recipient) => (
          <div key={recipient.memberId} style={{ borderTop: '1px solid #d7e2e5', paddingTop: 10 }}>
            <div style={{ fontWeight: 700, color: '#103244' }}>{recipient.customerId}</div>
            <div className="muted" style={{ marginTop: 4 }}>
              {Object.entries(recipient.channels).map(([channel, result]) => `${formatLabel(channel)}: ${result.status}${result.errorMessage ? ` (${result.errorMessage})` : ''}`).join(' | ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderNotificationAction(
  item: NotificationCenterItem,
  onOpenPaymentReceipts?: ManagerNotificationCenterPageProps['onOpenPaymentReceipts'],
) {
  if (!item.deepLink || !item.actionLabel) {
    return 'No target';
  }

  const paymentFilter = resolvePaymentReceiptFilter(item.deepLink);
  if (paymentFilter && onOpenPaymentReceipts) {
    return (
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() =>
          onOpenPaymentReceipts({
            memberId: item.userId,
            filter: paymentFilter,
          })
        }
      >
        {item.actionLabel}
      </button>
    );
  }

  return <code>{item.deepLink}</code>;
}

function resolvePaymentReceiptFilter(
  deepLink: string,
): 'all' | 'qr_payment' | 'school_payment' | 'payment_dispute' | 'failed_transfer' | null {
  if (!deepLink.startsWith('/payments/receipts')) {
    return null;
  }

  const params = new URLSearchParams(deepLink.split('?')[1] ?? '');
  switch (params.get('filter')) {
    case 'qr':
      return 'qr_payment';
    case 'school':
      return 'school_payment';
    case 'disputes':
      return 'payment_dispute';
    case 'failed_transfers':
      return 'failed_transfer';
    default:
      return 'all';
  }
}

function buildFilters(session: AdminSession) {
  return {};
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type ReminderPreviewModel = {
  title: string;
  subject: string;
  intro: string;
  englishLabel: string;
  amharicIntro: string;
  details: Array<{ label: string; value: string }>;
  amharicDetails: Array<{ label: string; value: string }>;
  englishFooter: string;
  amharicFooter: string;
};

function formatCampaignSuccess(campaign: NotificationCampaignItem) {
  const summary = campaign.deliverySummary;
  if (!summary) {
    return `Reminder sent successfully. Campaign status: ${campaign.status}.`;
  }

  const channelLines = Object.entries(summary.channels).map(([channel, stats]) => {
    const parts = [];
    if (stats.sent) parts.push(`${stats.sent} sent`);
    if (stats.delivered) parts.push(`${stats.delivered} delivered`);
    if (stats.skipped) parts.push(`${stats.skipped} skipped`);
    if (stats.failed) parts.push(`${stats.failed} failed`);
    return `${formatLabel(channel)}: ${parts.join(', ') || 'no activity'}`;
  });

  return `Reminder campaign ${campaign.status}. Targets: ${summary.totalTargets}. ${channelLines.join(' | ')}`;
}

function buildTelegramPreview(category: NotificationCategory) {
  if (category === 'insurance') {
    return [
      'Bunna Bank',
      '',
      'Insurance Renewal Reminder',
      '',
      'Dear Abebe Kebede,',
      'Your insurance policy is approaching renewal.',
      '',
      'Provider: Bunna Insurance',
      'Policy Number: BUN-100001-INS-001',
      'Renewal Due Date: March 19, 2026',
      '',
      'Please complete the renewal before the deadline.',
    ].join('\n');
  }

  if (category === 'kyc') {
    return [
      'Bunna Bank',
      '',
      'KYC Review Reminder',
      '',
      'Dear Mekdes Ali,',
      'Your onboarding review needs additional action.',
      '',
      'Customer ID: BUN-100004',
      'Required Step: Re-upload clear Fayda back image',
      'Branch: Debre Markos Main Branch',
      '',
      'Complete the requested KYC action to unlock secure services.',
    ].join('\n');
  }

  if (category === 'autopay') {
    return [
      'Bunna Bank',
      '',
      'AutoPay Failure Reminder',
      '',
      'Dear Abebe Kebede,',
      'Your scheduled AutoPay could not be completed.',
      '',
      'Payment Type: Loan installment',
      'Reference: BUN-100001',
      'Reason: Funding account balance was not sufficient',
      '',
      'Please review the account and retry before the next due date.',
    ].join('\n');
  }

  if (category === 'shareholder') {
    return [
      'Bunna Bank',
      '',
      'Shareholder Governance Update',
      '',
      'Dear Shareholder,',
      'A governance announcement or voting update is available in your app.',
      '',
      'Event: Annual Shareholder Vote',
      'Status: Open',
      'Action: Review and participate before the closing date',
    ].join('\n');
  }

  return [
    'Bunna Bank',
    '',
    'Loan Payment Reminder',
    '',
    'Dear Abebe Kebede,',
    'Your loan payment is due soon.',
    '',
    'Amount: ETB 502,346.00',
    'Due Date: March 17, 2026',
    'Reference: BUN-100001',
    '',
    'Please make your payment before the due date.',
  ].join('\n');
}

function buildReminderPreview(
  category: NotificationCategory,
  subject: string,
  intro: string,
): ReminderPreviewModel {
  if (category === 'insurance') {
    return {
      title: 'Insurance Renewal Reminder',
      subject: subject || 'Insurance Renewal Reminder',
      intro:
        intro ||
        'Your insurance policy is approaching its renewal date. Please review the policy details below and submit the required renewal documents before the deadline.',
      englishLabel: 'Insurance Renewal Reminder',
      amharicIntro:
        'የኢንሹራንስ ፖሊሲዎ የማደስ ጊዜ ቀርቧል። ከታች ያለውን መረጃ ይመልከቱ እና ሰነዶቹን በወቅቱ ያቅርቡ።',
      details: [
        { label: 'Customer', value: 'Abebe Kebede' },
        { label: 'Provider', value: 'Bunna Insurance' },
        { label: 'Policy Number', value: 'BUN-100001-INS-001' },
        { label: 'Renewal Due Date', value: 'March 19, 2026' },
      ],
      amharicDetails: [
        { label: 'ደንበኛ', value: 'Abebe Kebede' },
        { label: 'አቅራቢ', value: 'Bunna Insurance' },
        { label: 'ፖሊሲ ቁጥር', value: 'BUN-100001-INS-001' },
        { label: 'የማደስ ቀን', value: 'March 19, 2026' },
      ],
      englishFooter: 'Thank you, Insurance Service Department, Bunna Bank.',
      amharicFooter: 'እናመሰግናለን፣ የኢንሹራንስ አገልግሎት ቡድን፣ አማራ ባንክ።',
    };
  }

  if (category === 'kyc') {
    return {
      title: 'KYC Pending Reminder',
      subject: subject || 'Complete Your KYC Review',
      intro:
        intro ||
        'Your onboarding review needs additional action before secure services can be enabled. Please review the requested KYC steps below and respond as soon as possible.',
      englishLabel: 'KYC Pending Reminder',
      amharicIntro:
        'የመመዝገቢያ ግምገማዎ ተጨማሪ እርምጃ ይፈልጋል። ደህንነት ያላቸው አገልግሎቶች ከመከፈታቸው በፊት ከታች ያለውን መረጃ ይጨርሱ።',
      details: [
        { label: 'Customer', value: 'Mekdes Ali' },
        { label: 'Customer ID', value: 'BUN-100004' },
        { label: 'Required Action', value: 'Re-upload clear Fayda back image' },
        { label: 'Branch', value: 'Debre Markos Main Branch' },
      ],
      amharicDetails: [
        { label: 'ደንበኛ', value: 'Mekdes Ali' },
        { label: 'የደንበኛ ቁጥር', value: 'BUN-100004' },
        { label: 'የሚፈለገው እርምጃ', value: 'የፋይዳ ጀርባ ምስል እንደገና ያቅርቡ' },
        { label: 'ቅርንጫፍ', value: 'Debre Markos Main Branch' },
      ],
      englishFooter: 'Thank you, KYC Review Team, Bunna Bank.',
      amharicFooter: 'እናመሰግናለን፣ የKYC ግምገማ ቡድን፣ አማራ ባንክ።',
    };
  }

  if (category === 'autopay') {
    return {
      title: 'AutoPay Failure Reminder',
      subject: subject || 'AutoPay Action Needed',
      intro:
        intro ||
        'Your scheduled AutoPay could not be completed. Please review the payment source and retry before the next due date to avoid service disruption.',
      englishLabel: 'AutoPay Failure Reminder',
      amharicIntro:
        'የተያዘው የAutoPay ክፍያ አልተሳካም። እባክዎ የክፍያ ምንጩን ይመልከቱ እና ከሚቀጥለው ቀን በፊት እንደገና ይሞክሩ።',
      details: [
        { label: 'Customer', value: 'Abebe Kebede' },
        { label: 'Payment Type', value: 'Loan installment AutoPay' },
        { label: 'Reference', value: 'BUN-100001' },
        { label: 'Issue', value: 'Funding account balance was not sufficient' },
      ],
      amharicDetails: [
        { label: 'ደንበኛ', value: 'Abebe Kebede' },
        { label: 'የክፍያ አይነት', value: 'የብድር ክፍያ AutoPay' },
        { label: 'ማጣቀሻ', value: 'BUN-100001' },
        { label: 'ችግር', value: 'በሂሳቡ ውስጥ በቂ ቀሪ ገንዘብ የለም' },
      ],
      englishFooter: 'Thank you, Payment Operations Team, Bunna Bank.',
      amharicFooter: 'እናመሰግናለን፣ የክፍያ ኦፕሬሽን ቡድን፣ አማራ ባንክ።',
    };
  }

  if (category === 'shareholder') {
    return {
      title: 'Shareholder Update',
      subject: subject || 'Shareholder Governance Update',
      intro:
        intro ||
        'A new shareholder governance update is available. Open the app to review the announcement or participate in the active vote.',
      englishLabel: 'Shareholder governance update',
      amharicIntro:
        'አዲስ የባለአክሲዮን አስተዳደር ማስታወቂያ ወይም ድምጽ መስጫ ዝማኔ ተገኝቷል። ወደ መተግበሪያው ግቡ እና ይመልከቱ።',
      details: [
        { label: 'Audience', value: 'Eligible shareholder members' },
        { label: 'Event', value: 'Annual Shareholder Vote' },
        { label: 'Status', value: 'Open' },
        { label: 'Closing Date', value: 'March 25, 2026' },
      ],
      amharicDetails: [
        { label: 'ተቀባይ', value: 'ብቁ ባለአክሲዮን አባላት' },
        { label: 'ክስተት', value: 'ዓመታዊ የባለአክሲዮን ድምጽ መስጫ' },
        { label: 'ሁኔታ', value: 'ክፍት' },
        { label: 'የመዝጊያ ቀን', value: 'March 25, 2026' },
      ],
      englishFooter: 'Only eligible shareholder members can access this governance update.',
      amharicFooter: 'ይህን የአስተዳደር ዝማኔ ማየት የሚችሉት ብቁ ባለአክሲዮን አባላት ብቻ ናቸው።',
    };
  }

  return {
    title: 'Loan Due Soon Reminder',
    subject: subject || 'Your Loan Payment Reminder',
    intro:
      intro ||
      'This is a reminder that your loan installment is due soon. Please review the payment details below and arrange settlement before the due date.',
    englishLabel: 'Loan Due Soon Reminder',
    amharicIntro:
      'የብድር ክፍያዎ ቀን ቀርቧል። እባክዎ ከታች ያለውን የክፍያ መረጃ ይመልከቱ እና ክፍያውን በወቅቱ ያጠናቅቁ።',
    details: [
      { label: 'Customer', value: 'Abebe Kebede' },
      { label: 'Payment Amount', value: 'ETB 502,346.00' },
      { label: 'Due Date', value: 'March 17, 2026' },
    ],
    amharicDetails: [
      { label: 'ደንበኛ', value: 'Abebe Kebede' },
      { label: 'የክፍያ መጠን', value: 'ETB 502,346.00' },
      { label: 'የመጨረሻ ቀን', value: 'March 17, 2026' },
    ],
    englishFooter: 'Thank you, Loan Service Department, Bunna Bank.',
    amharicFooter: 'እናመሰግናለን፣ የብድር አገልግሎት ዳይሬክቶሬት፣ አማራ ባንክ።',
  };
}

function TelegramReminderPreview({ message }: { message: string }) {
  return (
    <div
      style={{
        border: '1px solid #d7e2e5',
        borderRadius: 20,
        background: '#eef4f5',
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#667985',
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        Telegram Preview
      </div>
      <div className="muted" style={{ marginBottom: 10 }}>
        Telegram reminders are delivered only to customers who have connected the Bunna Bank Telegram bot.
      </div>
      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          color: '#103244',
        }}
      >
        {message}
      </pre>
    </div>
  );
}

function ReminderEmailPreview({ model }: { model: ReminderPreviewModel }) {
  const brandBlue = '#024561';
  const brandBlueDeep = '#033954';
  const brandTeal = '#4FA2AB';
  const brandGold = '#DCA55A';
  const pageBackground = '#F6F8F9';
  const cardBackground = '#FFFFFF';
  const sectionBackground = '#EEF4F5';
  const borderColor = '#D7E2E5';
  const titleText = '#103244';
  const bodyText = '#243844';
  const mutedText = '#667985';

  return (
    <div
      style={{
        marginTop: 12,
        border: `1px solid ${borderColor}` ,
        borderRadius: 24,
        background: cardBackground,
        overflow: 'hidden',
        boxShadow: '0 18px 34px rgba(3, 57, 84, 0.08)',
      }}
    >
      <div
        style={{
          padding: 24,
          background: brandBlue,
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={AMHARA_LOGO_DATA_URL}
            alt="Bunna Bank"
            width={60}
            height={60}
            style={{
              display: 'block',
              width: 60,
              height: 60,
              objectFit: 'contain',
              borderRadius: 18,
              background: '#FFFFFF',
              padding: 6,
            }}
          />
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 999,
                background: brandGold,
                color: brandBlueDeep,
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontWeight: 800,
              }}
            >
              BUNNA BANK
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
              }}
            >
              {model.title}
            </div>
            <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.88)', fontSize: 14 }}>
              {model.subject}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 24, background: cardBackground }}>
        <div
          style={{
            marginBottom: 18,
            padding: 14,
            borderRadius: 14,
            border: `1px solid ${borderColor}` ,
            background: pageBackground,
            color: bodyText,
            lineHeight: 1.7,
          }}
        >
          {model.intro}
        </div>

        <div style={{ color: bodyText, lineHeight: 1.7, marginBottom: 18 }}>
          Dear Abebe Kebede,
        </div>

        <div
          style={{
            marginBottom: 20,
            padding: 18,
            border: `1px solid ${borderColor}` ,
            borderRadius: 18,
            background: sectionBackground,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: mutedText,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            {model.englishLabel}
          </div>
          {model.details.map((item) => (
            <div key={item.label} style={{ marginBottom: 10, color: bodyText }}>
              <strong>{item.label}:</strong> {item.value}
            </div>
          ))}
        </div>
        <div style={{ color: bodyText, lineHeight: 1.7 }}>{model.englishFooter}</div>

        <div
          style={{
            margin: '24px 0 16px',
            paddingBottom: 12,
            borderBottom: `1px solid ${borderColor}` ,
            fontSize: 12,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: mutedText,
            fontWeight: 800,
          }}
        >
          አማርኛ
        </div>

        <div style={{ color: bodyText, lineHeight: 1.8, marginBottom: 18 }}>
          {model.amharicIntro}
        </div>
        <div
          style={{
            marginBottom: 20,
            padding: 18,
            border: `1px solid ${borderColor}` ,
            borderRadius: 18,
            background: sectionBackground,
          }}
        >
          {model.amharicDetails.map((item) => (
            <div key={item.label} style={{ marginBottom: 10, color: bodyText }}>
              <strong>{item.label}:</strong> {item.value}
            </div>
          ))}
        </div>
        <div style={{ color: bodyText, lineHeight: 1.8 }}>{model.amharicFooter}</div>

        <div
          style={{
            marginTop: 22,
            paddingTop: 14,
            borderTop: `1px solid ${borderColor}` ,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            color: titleText,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <span>Bunna Bank</span>
          <span style={{ color: brandTeal }}>Email Preview</span>
        </div>
      </div>
    </div>
  );
}
