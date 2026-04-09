import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AdminSession } from '../../core/session';
import type {
  CardOperationDetail,
  CardOperationItem,
  CardRequestStatus,
  CardRequestType,
  CardStatus,
} from '../../core/api/contracts';
import {
  DashboardGrid,
  DashboardMetricRow,
  DashboardPage,
  DashboardSectionCard,
  DashboardTableCard,
  EmptyStateCard,
} from '../../shared/components/BankingDashboard';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type CardOperationsPageProps = {
  session: AdminSession;
};

export function CardOperationsPage({ session }: CardOperationsPageProps) {
  const { cardOperationsApi } = useAppClient();
  const [items, setItems] = useState<CardOperationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selected, setSelected] = useState<CardOperationDetail | null>(null);
  const [selectedCardStatus, setSelectedCardStatus] = useState<CardStatus | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | CardRequestStatus>('all');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!cardOperationsApi) {
      setItems([]);
      return;
    }

    let cancelled = false;

    void cardOperationsApi.getRequests().then((result) => {
      if (!cancelled) {
        setItems(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cardOperationsApi]);

  useEffect(() => {
    if (!cardOperationsApi || !selectedId) {
      setSelected(null);
      setSelectedCardStatus(null);
      return;
    }

    let cancelled = false;

    void cardOperationsApi.getRequest(selectedId).then((result) => {
      if (!cancelled) {
        setSelected(result);
        setSelectedCardStatus(result.card?.status ?? null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cardOperationsApi, selectedId]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') {
      return items;
    }

    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, items]);

  const summary = {
    total: items.length,
    submitted: items.filter((item) => item.status === 'submitted').length,
    inFlight: items.filter((item) => ['under_review', 'approved'].includes(item.status)).length,
    completed: items.filter((item) => item.status === 'completed').length,
  };

  async function handleStatusChange(status: CardRequestStatus) {
    if (!selected || !cardOperationsApi) {
      return;
    }

    const note =
      status === 'under_review'
        ? 'Card operations team is reviewing the request.'
        : status === 'approved'
          ? 'The request was approved and moved to fulfillment.'
          : status === 'completed'
            ? 'Card issuance workflow completed successfully.'
            : 'Request outcome was recorded.';

    const updated = await cardOperationsApi.updateStatus(selected.id, { status, note });

    setSelectedCardStatus(updated.card.status);
    setSelected((current) =>
      current
        ? {
            ...current,
            ...updated.request,
            card: updated.card,
            timeline: [
              ...current.timeline,
              {
                id: `${updated.request.id}_${current.timeline.length + 1}`,
                actorType: 'staff',
                actorName: session.fullName,
                eventType: 'request_status_updated',
                note,
                createdAt: updated.request.updatedAt,
              },
            ],
          }
        : current,
    );
    setItems((current) =>
      current.map((item) =>
        item.id === updated.request.id
          ? {
              ...item,
              status: updated.request.status,
              reason: updated.request.reason,
              updatedAt: updated.request.updatedAt,
            }
          : item,
      ),
    );
    setActionMessage(
      `Updated ${formatRequestType(updated.request.requestType)} request to ${formatLabel(updated.request.status)}.`,
    );
  }

  return (
    <DashboardPage>
      {!cardOperationsApi ? (
        <Panel
          title="Card Operations"
          description="Card operations are unavailable in this preview client."
        />
      ) : null}

      <DashboardGrid>
        <DashboardSectionCard
          title="Card Operations Snapshot"
          description="Review ATM issuance and replacement requests, then move them through the staff workflow."
        >
          <div className="dashboard-stack">
            <DashboardMetricRow label="All requests" value={summary.total.toLocaleString()} />
            <DashboardMetricRow label="Submitted" value={summary.submitted.toLocaleString()} />
            <DashboardMetricRow label="In flight" value={summary.inFlight.toLocaleString()} />
            <DashboardMetricRow label="Completed" value={summary.completed.toLocaleString()} />
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Card Queue Focus"
          description="Use queue filters to separate submitted, approved, and completed requests."
        >
          <div className="loan-filter-row">
            {[
              { id: 'all', label: `All (${summary.total})` },
              { id: 'submitted', label: `Submitted (${summary.submitted})` },
              { id: 'under_review', label: 'Under Review' },
              { id: 'approved', label: 'Approved' },
              { id: 'completed', label: `Completed (${summary.completed})` },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={activeFilter === filter.id ? 'loan-filter-chip active' : 'loan-filter-chip'}
                onClick={() => setActiveFilter(filter.id as 'all' | CardRequestStatus)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="dashboard-stack">
            <DashboardMetricRow
              label="Visible requests"
              value={filteredItems.length.toLocaleString()}
              note="Current card-request filter"
            />
            <DashboardMetricRow
              label="Selected request"
              value={selected ? formatRequestType(selected.requestType) : 'Not selected'}
              note={selected ? (selected.preferredBranch ?? session.branchName ?? 'n/a') : 'Pick a request from the queue'}
            />
          </div>
        </DashboardSectionCard>
      </DashboardGrid>

      {filteredItems.length > 0 ? (
        <DashboardTableCard
          title="Card Requests"
          description="Current issuance and replacement requests in this scope."
          headers={['Branch', 'Type', 'Status', 'Updated', 'Open']}
          rows={filteredItems.map((item) => [
            item.preferredBranch ?? session.branchName ?? 'n/a',
            formatRequestType(item.requestType),
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
          ])}
        />
      ) : (
        <DashboardSectionCard
          title="Card Requests"
          description="Current issuance and replacement requests in this scope."
        >
          <EmptyStateCard
            title="No card requests in this filter"
            description="No card issuance or replacement requests match the current queue filter."
          />
        </DashboardSectionCard>
      )}

      {cardOperationsApi && selected ? (
        <Panel
          title={`${formatRequestType(selected.requestType)} · ${selected.preferredBranch ?? session.branchName ?? 'n/a'}`}
          description="Inspect the request reason, review the current state, and update the workflow outcome."
        >
          <div className="dashboard-summary-strip">
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Request status</span>
              <strong>{formatLabel(selected.status)}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Card status</span>
              <strong>{selectedCardStatus ? formatLabel(selectedCardStatus) : 'Pending action'}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Branch</span>
              <strong>{selected.preferredBranch ?? session.branchName ?? 'n/a'}</strong>
            </div>
          </div>

          <div className="loan-detail-grid">
            <div>
              <p className="eyebrow">Request summary</p>
              <h3>{formatRequestType(selected.requestType)}</h3>
              <p className="muted">{selected.reason ?? 'No request note was provided.'}</p>
              <p className="muted">
                <strong>Member:</strong> {selected.memberName} ({selected.customerId})
              </p>
              {selected.phoneNumber ? (
                <p className="muted">
                  <strong>Phone:</strong> {selected.phoneNumber}
                </p>
              ) : null}
              <p className="muted">
                <strong>Member ID:</strong> {selected.memberId}
              </p>
              {selected.cardId ? (
                <p className="muted">
                  <strong>Card ID:</strong> {selected.cardId}
                </p>
              ) : null}
              {selected.card ? (
                <p className="muted">
                  <strong>Card Type:</strong> {selected.card.cardType}
                  {selected.card.last4 ? ` • **** ${selected.card.last4}` : ''}
                </p>
              ) : null}
            </div>
            <div>
              <p className="eyebrow">Actions</p>
              <div className="loan-filter-row">
                {(['under_review', 'approved', 'completed', 'rejected'] as CardRequestStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      className="loan-filter-chip"
                      onClick={() => void handleStatusChange(status)}
                    >
                      Mark {formatLabel(status)}
                    </button>
                  ),
                )}
              </div>
              {actionMessage ? <p className="muted">{actionMessage}</p> : null}
            </div>
          </div>

          <SimpleTable
            headers={['When', 'Actor', 'Event', 'Note']}
            rows={selected.timeline.map((event) => [
              event.createdAt ?? 'n/a',
              event.actorName ?? event.actorType,
              formatLabel(event.eventType),
              event.note ?? 'n/a',
            ])}
            emptyState={{
              title: 'No timeline yet',
              description: 'Card request timeline events appear here after submission and staff updates.',
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

function formatRequestType(type: CardRequestType) {
  return type === 'new_issue' ? 'New Card Issue' : 'Card Replacement';
}
