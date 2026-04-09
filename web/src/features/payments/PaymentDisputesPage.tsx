import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AdminSession } from '../../core/session';
import type {
  AttachmentMetadata,
  PaymentReceiptItem,
  ServiceRequestDetail,
  ServiceRequestItem,
  ServiceRequestStatus,
  ServiceRequestType,
} from '../../core/api/contracts';
import {
  DashboardGrid,
  DashboardMetricRow,
  DashboardPage,
  DashboardSectionCard,
  DashboardTableCard,
} from '../../shared/components/BankingDashboard';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

const PAYMENT_TYPES: ServiceRequestType[] = ['failed_transfer', 'payment_dispute'];

type PaymentDisputesPageProps = {
  session: AdminSession;
};

export function PaymentDisputesPage({ session }: PaymentDisputesPageProps) {
  const { serviceRequestApi, paymentOperationsApi } = useAppClient();
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selected, setSelected] = useState<ServiceRequestDetail | null>(null);
  const [receipts, setReceipts] = useState<PaymentReceiptItem[]>([]);
  const [attachmentMetadata, setAttachmentMetadata] = useState<Record<string, AttachmentMetadata>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | ServiceRequestStatus>('all');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!serviceRequestApi) {
      setItems([]);
      return;
    }

    let cancelled = false;

    void serviceRequestApi.getRequests().then((result) => {
      if (!cancelled) {
        setItems(result.items.filter((item) => PAYMENT_TYPES.includes(item.type)));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [serviceRequestApi]);

  useEffect(() => {
    if (!serviceRequestApi || !selectedId) {
      setSelected(null);
      return;
    }

    let cancelled = false;

    void serviceRequestApi.getRequest(selectedId).then((result) => {
      if (!cancelled && PAYMENT_TYPES.includes(result.type)) {
        setSelected(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedId, serviceRequestApi]);

  useEffect(() => {
    if (!paymentOperationsApi || !selected?.memberId) {
      setReceipts([]);
      return;
    }

    let cancelled = false;

    void paymentOperationsApi.getMemberReceipts(selected.memberId).then((result) => {
      if (!cancelled) {
        setReceipts(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [paymentOperationsApi, selected?.memberId]);

  useEffect(() => {
    if (!paymentOperationsApi || !selected || selected.attachments.length === 0) {
      setAttachmentMetadata({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      selected.attachments.map(async (attachment) => [
        attachment,
        await paymentOperationsApi.getAttachmentMetadata(attachment),
      ] as const),
    ).then((entries) => {
      if (cancelled) {
        return;
      }

      setAttachmentMetadata(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [paymentOperationsApi, selected]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') {
      return items;
    }

    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, items]);

  const summary = {
    total: items.length,
    submitted: items.filter((item) => item.status === 'submitted').length,
    awaitingCustomer: items.filter((item) => item.status === 'awaiting_customer').length,
    completed: items.filter((item) => item.status === 'completed').length,
  };

  async function handleStatusChange(status: ServiceRequestStatus) {
    if (!selected || !serviceRequestApi) {
      return;
    }

    const note =
      status === 'under_review'
        ? 'Payments operations is reviewing the dispute.'
        : status === 'awaiting_customer'
          ? 'Additional transaction evidence is required from the customer.'
          : status === 'completed'
            ? 'Payment dispute review completed successfully.'
            : 'Dispute outcome was recorded.';

    const updated = await serviceRequestApi.updateStatus(selected.id, { status, note });

    setSelected(updated);
    setItems((current) =>
      current.map((item) =>
        item.id === updated.id
          ? {
              ...item,
              status: updated.status,
              latestNote: updated.latestNote,
              updatedAt: updated.updatedAt,
            }
          : item,
      ),
    );
    setActionMessage(`Updated payment case ${updated.customerId} to ${formatLabel(updated.status)}.`);
  }

  async function handleOpenEvidence(storageKey: string) {
    if (!paymentOperationsApi) {
      return;
    }

    const blob = await paymentOperationsApi.downloadAttachment(storageKey);
    openAttachmentBlob(blob, formatAttachmentLabel(storageKey));
    setActionMessage(`Opened payment evidence ${formatAttachmentLabel(storageKey)}.`);
  }

  async function handleDownloadEvidence(storageKey: string) {
    if (!paymentOperationsApi) {
      return;
    }

    const blob = await paymentOperationsApi.downloadAttachment(storageKey);
    downloadAttachmentBlob(
      blob,
      attachmentMetadata[storageKey]?.originalFileName ?? formatAttachmentLabel(storageKey),
    );
    setActionMessage(`Downloaded payment evidence ${formatAttachmentLabel(storageKey)}.`);
  }

  return (
    <DashboardPage>
      {!serviceRequestApi ? (
        <Panel
          title="Payment Disputes"
          description="Payment dispute workflows are unavailable in this preview client."
        />
      ) : null}

      <DashboardGrid>
        <DashboardSectionCard
          title="Payment Dispute Snapshot"
          description="Review failed transfer and payment dispute requests, then move them through the operations workflow."
        >
          <div className="dashboard-stack">
            <DashboardMetricRow label="All payment cases" value={summary.total.toLocaleString()} />
            <DashboardMetricRow label="New" value={summary.submitted.toLocaleString()} />
            <DashboardMetricRow label="Awaiting customer" value={summary.awaitingCustomer.toLocaleString()} />
            <DashboardMetricRow label="Completed" value={summary.completed.toLocaleString()} />
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Dispute Queue Focus"
          description="Use the queue filter to isolate new and customer-dependent cases."
        >
          <div className="loan-filter-row">
            {[
              { id: 'all', label: `All (${summary.total})` },
              { id: 'submitted', label: `Submitted (${summary.submitted})` },
              { id: 'under_review', label: 'Under Review' },
              { id: 'awaiting_customer', label: `Awaiting Customer (${summary.awaitingCustomer})` },
              { id: 'completed', label: `Completed (${summary.completed})` },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={activeFilter === filter.id ? 'loan-filter-chip active' : 'loan-filter-chip'}
                onClick={() => setActiveFilter(filter.id as 'all' | ServiceRequestStatus)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="dashboard-stack">
            <DashboardMetricRow
              label="Visible cases"
              value={filteredItems.length.toLocaleString()}
              note="Current payment-dispute filter"
            />
            <DashboardMetricRow
              label="Selected case"
              value={selected ? formatTypeLabel(selected.type) : 'Not selected'}
              note={selected ? `${selected.memberName} (${selected.customerId})` : 'Pick a dispute from the queue'}
            />
          </div>
        </DashboardSectionCard>
      </DashboardGrid>

      <DashboardTableCard
        title="Payment Disputes"
        description="Current failed transfer and payment dispute requests."
        headers={['Customer', 'Case Type', 'Status', 'Updated', 'Open']}
        rows={
          filteredItems.length > 0
            ? filteredItems.map((item) => [
                `${item.memberName} (${item.customerId})`,
                formatTypeLabel(item.type),
                formatLabel(item.status),
                item.updatedAt ?? item.createdAt ?? 'n/a',
                <button
                  key={item.id}
                  type="button"
                  className="loan-watchlist-link"
                  onClick={() => setSelectedId(item.id)}
                >
                  Review dispute
                </button>,
              ])
            : [['No payment disputes in this filter', '-', '-', '-', '-']]
        }
      />

      {serviceRequestApi && selected ? (
        <Panel
          title={`${selected.memberName} · ${formatTypeLabel(selected.type)}`}
          description="Inspect the payment issue, check the case timeline, and update the dispute workflow."
        >
          <div className="dashboard-summary-strip">
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Current status</span>
              <strong>{formatLabel(selected.status)}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Branch</span>
              <strong>{selected.branchName ?? session.branchName ?? 'n/a'}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Attachments</span>
              <strong>{selected.attachments.length.toLocaleString()}</strong>
            </div>
          </div>

          <div className="loan-detail-grid">
            <div>
              <p className="eyebrow">Case summary</p>
              <h3>{selected.title}</h3>
              <p className="muted">{selected.description}</p>
              {selected.latestNote ? (
                <p className="muted">
                  <strong>Latest note:</strong> {selected.latestNote}
                </p>
              ) : null}
            </div>
            <div>
              <p className="eyebrow">Actions</p>
              <div className="loan-filter-row">
                {(
                  ['under_review', 'awaiting_customer', 'approved', 'completed', 'rejected'] as ServiceRequestStatus[]
                ).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="loan-filter-chip"
                    onClick={() => void handleStatusChange(status)}
                  >
                    Mark {formatLabel(status)}
                  </button>
                ))}
              </div>
              {actionMessage ? <p className="muted">{actionMessage}</p> : null}
            </div>
          </div>

          {buildPaymentFacts(selected.payload).length > 0 ? (
            <SimpleTable
              headers={['Field', 'Value']}
              rows={buildPaymentFacts(selected.payload).map((item) => [item.label, item.value])}
              emptyState={{
                title: 'No payment metadata',
                description: 'No structured transaction data was attached to this dispute.',
              }}
            />
          ) : null}

          {selected.attachments.length > 0 ? (
            <Panel
              title="Submitted Evidence"
              description="Receipts and other customer-provided files attached to the payment case."
            >
              <SimpleTable
                headers={['Evidence', 'Type', 'Size', 'Actions']}
                rows={selected.attachments.map((attachment) => [
                  attachmentMetadata[attachment]?.originalFileName ?? formatAttachmentLabel(attachment),
                  formatMimeType(attachmentMetadata[attachment]?.mimeType),
                  formatFileSize(attachmentMetadata[attachment]?.sizeBytes),
                  <div key={`actions-${attachment}`} style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="loan-watchlist-link"
                      onClick={() => void handleOpenEvidence(attachment)}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="loan-watchlist-link"
                      onClick={() => void handleDownloadEvidence(attachment)}
                    >
                      Download
                    </button>
                  </div>,
                ])}
                emptyState={{
                  title: 'No uploaded evidence',
                  description: 'Receipt evidence will appear here after customer upload.',
                }}
              />
            </Panel>
          ) : (
            <Panel
              title="Submitted Evidence"
              description="Receipts and other customer-provided files attached to the payment case."
            >
              <p className="muted">
                No receipt or supporting file has been uploaded yet.
              </p>
            </Panel>
          )}

          <SimpleTable
            headers={['Receipt', 'Type', 'Amount', 'Reference', 'Evidence']}
            rows={receipts.map((item) => [
              item.title,
              formatLabel(item.receiptType),
              item.amount != null ? `ETB ${item.amount.toLocaleString()}` : 'n/a',
              item.transactionReference ?? 'n/a',
              item.attachments.length > 0
                ? item.attachments.map(formatAttachmentLabel).join(', ')
                : 'No file uploaded',
            ])}
            emptyState={{
              title: 'No payment receipts for this member',
              description: 'Receipt history will appear here when the customer has payment records or dispute evidence.',
            }}
          />

          <SimpleTable
            headers={['When', 'Actor', 'Event', 'Status', 'Note']}
            rows={(selected.timeline ?? []).map((event) => [
              event.createdAt ?? 'n/a',
              event.actorName ?? event.actorType,
              formatLabel(event.eventType),
              event.toStatus ? formatLabel(event.toStatus) : 'n/a',
              event.note ?? 'n/a',
            ])}
            emptyState={{
              title: 'No timeline yet',
              description: 'Timeline events appear after customer submission and staff updates.',
            }}
          />
        </Panel>
      ) : null}
    </DashboardPage>
  );
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatTypeLabel(type: ServiceRequestType) {
  if (type === 'failed_transfer') {
    return 'Failed Transfer';
  }

  return 'Payment Dispute';
}

function buildPaymentFacts(payload: Record<string, unknown>) {
  const entries = [
    {
      label: 'Transaction Reference',
      value:
        formatPayloadValue(payload.transactionReference) ??
        formatPayloadValue(payload.referenceNumber),
    },
    { label: 'Amount', value: formatCurrency(payload.amount) },
    { label: 'Counterparty', value: formatPayloadValue(payload.counterparty) },
    {
      label: 'Occurred At',
      value: formatPayloadValue(payload.occurredAt),
    },
  ];

  return entries.filter((item): item is { label: string; value: string } => Boolean(item.value));
}

function formatAttachmentLabel(value: string) {
  const clean = value.split('/').pop() ?? value;
  return clean.replace(/^\d+-/, '');
}

function openAttachmentBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const openedWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');

  if (openedWindow == null) {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

function downloadAttachmentBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

function formatMimeType(value?: string) {
  if (!value) {
    return 'Unknown';
  }

  if (value.startsWith('image/')) {
    return 'Image';
  }

  if (value === 'application/pdf') {
    return 'PDF';
  }

  return value;
}

function formatFileSize(value?: number) {
  if (typeof value !== 'number') {
    return 'n/a';
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${value} B`;
}

function formatPayloadValue(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString();
  }

  return undefined;
}

function formatCurrency(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return `ETB ${value.toLocaleString(undefined, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
