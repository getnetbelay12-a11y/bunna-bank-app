import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  CreateManagerNotificationCampaignPayload,
  InsuranceAlertItem,
  NotificationCampaignItem,
  NotificationLogItem,
  NotificationTemplateItem,
} from '../../core/api/contracts';
import { getManagerConsoleKind, type AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';
import { renderReminderEmailPreview } from './reminderEmailPreview';

type ManagerNotificationCenterPageProps = {
  session: AdminSession;
};

const allChannels = ['email', 'sms', 'telegram', 'in_app'] as const;
const localDemoRecipient = 'write2get@gmail.com';
const defaultTemplateTypeByCategory = {
  loan: 'loan_due_soon',
  insurance: 'insurance_renewal_reminder',
} as const;

export function ManagerNotificationCenterPage({
  session,
}: ManagerNotificationCenterPageProps) {
  const { notificationApi } = useAppClient();
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [campaigns, setCampaigns] = useState<NotificationCampaignItem[]>([]);
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [alerts, setAlerts] = useState<InsuranceAlertItem[]>([]);
  const [category, setCategory] = useState<'loan' | 'insurance'>('loan');
  const [templateType, setTemplateType] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['email']);
  const [targetType, setTargetType] = useState<
    'single_customer' | 'selected_customers' | 'filtered_customers'
  >('filtered_customers');
  const [targetIds, setTargetIds] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      notificationApi.getTemplates(),
      notificationApi.getCampaigns(),
      notificationApi.getLogs(),
      notificationApi.getInsuranceAlerts(),
    ]).then(([templatesResult, campaignsResult, logsResult, alertsResult]) => {
      if (cancelled) {
        return;
      }

      setTemplates(templatesResult);
      setCampaigns(campaignsResult);
      setLogs(logsResult);
      setAlerts(alertsResult);

      const initialTemplate = templatesResult.find((item) => item.category === 'loan');
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
  }, [notificationApi]);

  const filteredTemplates = useMemo(
    () => templates.filter((item) => item.category === category),
    [category, templates],
  );
  const selectedTemplate = useMemo(
    () => filteredTemplates.find((item) => item.templateType === templateType) ?? null,
    [filteredTemplates, templateType],
  );

  useEffect(() => {
    const nextTemplate = filteredTemplates[0];
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
      return `Restricted to ${session.branchName}`;
    }

    return 'Institution-wide reminder scope';
  }, [session]);
  const emailPreviewHtml = useMemo(
    () =>
      renderReminderEmailPreview({
        category,
        subject,
        messageBody,
      }),
    [category, messageBody, subject],
  );

  async function handleSend() {
    const resolvedTemplateType =
      templateType || defaultTemplateTypeByCategory[category];
    const normalizedChannels =
      selectedChannels.length === 0
        ? ['email']
        : selectedChannels.includes('email')
          ? selectedChannels
          : ['email', ...selectedChannels];

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
      const [campaignsResult, logsResult] = await Promise.all([
        notificationApi.getCampaigns(),
        notificationApi.getLogs(sentCampaign.id),
      ]);

      setCampaigns(campaignsResult);
      setLogs(logsResult);
      setFormSuccess(
        `Reminder email sent to ${localDemoRecipient}`,
      );
    } catch (error) {
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
    <div className="page-stack">
      <section className="hero hero-head-office">
        <div>
          <p className="eyebrow">Notification Center</p>
          <h2>Loan and insurance reminders with manager-controlled delivery</h2>
          <p className="muted">
            Category-driven reminder campaigns with Email, SMS, Telegram, and in-app
            tracking.
          </p>
        </div>
        <div className="hero-badges">
          <span className="badge badge-info">{scopeLabel}</span>
          <span className="badge">Auto-reminder rules ready for later</span>
        </div>
      </section>

      <div className="two-column-grid">
        <Panel
          title="Create Reminder Campaign"
          description="Choose category, template, channels, target scope, preview, and send."
        >
          <div className="form-grid">
            <label className="field-stack">
              <span>Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value as 'loan' | 'insurance')}>
                <option value="loan">Loan</option>
                <option value="insurance">Insurance</option>
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
                placeholder="MBR-1001, MBR-1002"
                value={targetIds}
                onChange={(event) => setTargetIds(event.target.value)}
              />
            </label>
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

          <p className="muted">
            Backend demo email delivery is forced to <strong>{localDemoRecipient}</strong>
            whenever Email is selected.
          </p>

          <div className="form-grid">
            <label className="field-stack field-span">
              <span>Subject</span>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} />
            </label>

            <label className="field-stack field-span">
              <span>Custom Intro Message</span>
              <textarea
                rows={5}
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
              />
            </label>
          </div>

          <div className="support-detail-panel">
            <div>
              <strong>Bunna Email Standard</strong>
              <p className="muted" style={{ marginTop: 8 }}>
                Loan and insurance reminders render with the Bunna bilingual
                format: logo, branded header, detail card, and Amharic translation
                below the English content.
              </p>
            </div>
            <div className="support-detail-meta">
              <span className="badge badge-info">
                {selectedTemplate ? selectedTemplate.title : 'Select template'}
              </span>
              <span className="badge">Forced test email: write2get@gmail.com</span>
            </div>
          </div>

          <div className="reminder-email-preview">
            <div className="reminder-email-preview-header">
              <div>
                <strong>Email Preview</strong>
                <p className="muted" style={{ marginTop: 6 }}>
                  Subject: {subject || 'Bunna reminder'}
                </p>
              </div>
              <span className="badge badge-info">{formatLabel(category)} email</span>
            </div>
            <div
              className="reminder-email-preview-frame"
              dangerouslySetInnerHTML={{ __html: emailPreviewHtml }}
            />
          </div>

          {formError ? <p className="muted" style={{ color: '#b42318' }}>{formError}</p> : null}
          {formSuccess ? <p className="muted" style={{ color: '#027a48' }}>{formSuccess}</p> : null}

          <div className="action-row">
            <span className={`pill-badge ${category === 'loan' ? 'loan' : 'insurance'}`}>
              {formatLabel(category)}
            </span>
            <button disabled={isSending} onClick={() => void handleSend()} type="button">
              {isSending ? 'Sending...' : 'Send Reminder'}
            </button>
          </div>
        </Panel>

        <Panel
          title="Insurance Alerts"
          description="Expiring, expired, and missing loan-linked insurance coverage."
        >
          <SimpleTable
            headers={['Customer', 'Alert', 'Policy', 'Action']}
            rows={
              alerts.length > 0
                ? alerts.map((item) => [
                    `${item.memberName} (${item.customerId})`,
                    formatLabel(item.alertType),
                    item.policyNumber ?? 'No linked policy',
                    item.requiresManagerAction ? 'Review now' : 'Tracked',
                  ])
                : [['Loading', '...', '...', '...']]
            }
          />
        </Panel>
      </div>

      <div className="two-column-grid">
        <Panel
          title="Campaigns"
          description="Manual reminder campaigns with current send state."
        >
          <SimpleTable
            headers={['Category', 'Template', 'Channels', 'Status']}
            rows={
              campaigns.length > 0
                ? campaigns.map((item) => [
                    formatLabel(item.category),
                    formatLabel(item.templateType),
                    item.channels.map(formatLabel).join(', '),
                    formatLabel(item.status),
                  ])
                : [['Loading', '...', '...', '...']]
            }
          />
        </Panel>

        <Panel
          title="Delivery Logs"
          description="Per-recipient delivery result tracking across channels."
        >
          <SimpleTable
            headers={['Channel', 'Recipient', 'Status', 'Error']}
            rows={
              logs.length > 0
                ? logs.map((item) => [
                    formatLabel(item.channel),
                    item.recipient,
                    formatLabel(item.status),
                    item.errorMessage ?? 'None',
                  ])
                : [['Loading', '...', '...', '...']]
            }
          />
        </Panel>
      </div>
    </div>
  );
}

function buildFilters(session: AdminSession) {
  return {};
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
