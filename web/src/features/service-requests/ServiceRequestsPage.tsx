import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AdminSession } from '../../core/session';
import type {
  AttachmentMetadata,
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

type ServiceRequestsPageProps = {
  session: AdminSession;
};

export function ServiceRequestsPage({ session }: ServiceRequestsPageProps) {
  const { serviceRequestApi } = useAppClient();
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selected, setSelected] = useState<ServiceRequestDetail | null>(null);
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
        setItems(result.items);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [serviceRequestApi]);

  useEffect(() => {
    if (!serviceRequestApi) {
      setSelected(null);
      return;
    }

    if (!selectedId) {
      setSelected(null);
      return;
    }

    let cancelled = false;

    void serviceRequestApi.getRequest(selectedId).then((result) => {
      if (!cancelled) {
        setSelected(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedId, serviceRequestApi]);

  useEffect(() => {
    if (!serviceRequestApi || !selected || selected.attachments.length === 0) {
      setAttachmentMetadata({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      selected.attachments.map(async (attachment) => [
        attachment,
        await serviceRequestApi.getAttachmentMetadata(attachment),
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
  }, [selected, serviceRequestApi]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') {
      return items;
    }

    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, items]);

  const summary = {
    total: items.length,
    submitted: items.filter((item) => item.status === 'submitted').length,
    inFlight: items.filter((item) =>
      ['under_review', 'awaiting_customer', 'approved'].includes(item.status),
    ).length,
    completed: items.filter((item) => item.status === 'completed').length,
  };

  async function handleStatusChange(status: ServiceRequestStatus) {
    if (!selected) {
      return;
    }

    if (!serviceRequestApi) {
      return;
    }

    const updated = await serviceRequestApi.updateStatus(selected.id, {
      status,
      note:
        status === 'under_review'
          ? 'Operations team is reviewing the request.'
          : status === 'awaiting_customer'
            ? 'Customer follow-up is required before processing can continue.'
            : status === 'completed'
              ? 'Request completed successfully.'
              : 'Request outcome was recorded.',
    });

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
    setActionMessage(`Updated request ${updated.customerId} to ${formatLabel(updated.status)}.`);
  }

  async function handleOpenEvidence(storageKey: string) {
    if (!serviceRequestApi) {
      return;
    }

    const blob = await serviceRequestApi.downloadAttachment(storageKey);
    openAttachmentBlob(blob, formatAttachmentLabel(storageKey));
    setActionMessage(`Opened evidence ${formatAttachmentLabel(storageKey)}.`);
  }

  async function handleDownloadEvidence(storageKey: string) {
    if (!serviceRequestApi) {
      return;
    }

    const blob = await serviceRequestApi.downloadAttachment(storageKey);
    downloadAttachmentBlob(
      blob,
      attachmentMetadata[storageKey]?.originalFileName ?? formatAttachmentLabel(storageKey),
    );
    setActionMessage(`Downloaded evidence ${formatAttachmentLabel(storageKey)}.`);
  }

  return (
    <DashboardPage>
      {!serviceRequestApi ? (
        <Panel
          title="Service Requests"
          description="Service request workflows are unavailable in this preview client."
        />
      ) : null}
      <DashboardGrid>
        <DashboardSectionCard
          title="Service Request Snapshot"
          description="Track customer-submitted disputes and service workflows for phone updates, card requests, failed transfers, and account relationship changes."
        >
          <div className="dashboard-stack">
            <DashboardMetricRow label="All requests" value={summary.total.toLocaleString()} />
            <DashboardMetricRow label="New" value={summary.submitted.toLocaleString()} />
            <DashboardMetricRow label="In flight" value={summary.inFlight.toLocaleString()} />
            <DashboardMetricRow label="Completed" value={summary.completed.toLocaleString()} />
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Queue Focus"
          description="Use queue filters to move from intake to completion faster."
        >
          <div className="loan-filter-row">
            {[
              { id: 'all', label: `All (${summary.total})` },
              { id: 'submitted', label: `Submitted (${summary.submitted})` },
              { id: 'under_review', label: 'Under Review' },
              { id: 'awaiting_customer', label: 'Awaiting Customer' },
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
              label="Visible queue"
              value={filteredItems.length.toLocaleString()}
              note="Requests matching the current filter"
            />
            <DashboardMetricRow
              label="Selected request"
              value={selected ? formatTypeLabel(selected.type) : 'Not selected'}
              note={selected ? `${selected.memberName} (${selected.customerId})` : 'Pick a request from the queue'}
            />
          </div>
        </DashboardSectionCard>
      </DashboardGrid>

      <DashboardTableCard
        title="Service Requests"
        description="Current customer-submitted service workflows in this scope."
        headers={['Customer', 'Type', 'Status', 'Updated', 'Open']}
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
                  Review request
                </button>,
              ])
            : [['No service requests in this filter', '-', '-', '-', '-']]
        }
      />

      {serviceRequestApi && selected ? (
        <Panel
          title={`${selected.memberName} · ${formatTypeLabel(selected.type)}`}
          description="Review the customer request, inspect the timeline, and move the workflow to its next state."
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
              <p className="eyebrow">Request summary</p>
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

          {buildRequestFacts(selected).length > 0 ? (
            <SimpleTable
              headers={['Field', 'Value']}
              rows={buildRequestFacts(selected).map((item) => [item.label, item.value])}
              emptyState={{
                title: 'No structured request data',
                description: 'No request-specific metadata was attached to this workflow.',
              }}
            />
          ) : null}

          {selected.attachments.length > 0 ? (
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
                title: 'No evidence uploaded',
                description: 'Customer-provided files will appear here after upload.',
              }}
            />
          ) : null}

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
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTypeLabel(type: ServiceRequestType) {
  return formatLabel(type);
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

function buildRequestFacts(request: ServiceRequestDetail) {
  const payload = request.payload ?? {};

  if (request.type === 'phone_update') {
    return buildFactList([['Requested Phone Number', payload.requestedPhoneNumber]]);
  }

  if (request.type === 'account_relationship') {
    return buildFactList([
      ['Relationship Type', payload.relationshipType],
      ['Related Member Number', payload.relatedMemberNumber],
      ['Related Customer ID', payload.relatedCustomerId],
    ]);
  }

  if (request.type === 'atm_card_request') {
    return buildFactList([
      ['Preferred Branch', payload.preferredBranch],
      ['Card Type', payload.cardType],
      ['Reason', payload.reason],
    ]);
  }

  if (request.type === 'failed_transfer' || request.type === 'payment_dispute') {
    return buildFactList([
      ['Transaction Reference', payload.transactionReference ?? payload.referenceNumber],
      ['Amount', formatCurrency(payload.amount)],
      ['Counterparty', payload.counterparty],
      ['Occurred At', payload.occurredAt],
    ]);
  }

  return [];
}

function buildFactList(entries: Array<[string, unknown]>) {
  return entries
    .map(([label, rawValue]) => {
      const value = formatFactValue(rawValue);
      return value ? { label, value } : null;
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
}

function formatFactValue(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
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

function formatAttachmentLabel(value: string) {
  const clean = value.split('/').pop() ?? value;
  return clean.replace(/^\d+-/, '');
}
