import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AdminSession } from '../../core/session';
import type {
  PaymentActivityItem,
  PaymentReceiptItem,
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

type PaymentOperationsPageProps = {
  session: AdminSession;
  initialMemberId?: string;
  initialFilter?: ReceiptFilter;
  returnContextLabel?: string;
  onReturnToContext?: () => void;
};

type ReceiptFilter = 'all' | PaymentReceiptItem['receiptType'];

export function PaymentOperationsPage({
  session,
  initialMemberId,
  initialFilter = 'all',
  returnContextLabel,
  onReturnToContext,
}: PaymentOperationsPageProps) {
  const { paymentOperationsApi } = useAppClient();
  const [activity, setActivity] = useState<PaymentActivityItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  const [receipts, setReceipts] = useState<PaymentReceiptItem[]>([]);
  const [receiptFilter, setReceiptFilter] = useState<ReceiptFilter>(initialFilter);
  const [evidenceMessage, setEvidenceMessage] = useState('');

  useEffect(() => {
    setReceiptFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (initialMemberId) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId]);

  useEffect(() => {
    if (!paymentOperationsApi) {
      setActivity([]);
      return;
    }

    let cancelled = false;

    void paymentOperationsApi.getActivity().then((result) => {
      if (cancelled) {
        return;
      }
      setActivity(result);
      setSelectedMemberId((current) =>
        current ?? initialMemberId ?? result[0]?.memberId,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [initialMemberId, paymentOperationsApi]);

  useEffect(() => {
    if (!paymentOperationsApi || !selectedMemberId) {
      setReceipts([]);
      return;
    }

    let cancelled = false;

    void paymentOperationsApi.getMemberReceipts(selectedMemberId).then((result) => {
      if (!cancelled) {
        setReceipts(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [paymentOperationsApi, selectedMemberId]);

  const memberQueue = useMemo(
    () =>
      [...activity].sort((left, right) =>
        compareDateString(right.latestActivityAt, left.latestActivityAt),
      ),
    [activity],
  );

  const selectedMember = memberQueue.find((item) => item.memberId === selectedMemberId);

  const filteredReceipts = useMemo(() => {
    if (receiptFilter === 'all') {
      return receipts;
    }

    return receipts.filter((item) => item.receiptType === receiptFilter);
  }, [receiptFilter, receipts]);

  const receiptSummary = {
    total: receipts.length,
    qr: receipts.filter((item) => item.receiptType === 'qr_payment').length,
    school: receipts.filter((item) => item.receiptType === 'school_payment').length,
    disputes: receipts.filter(
      (item) =>
        item.receiptType === 'payment_dispute' || item.receiptType === 'failed_transfer',
    ).length,
  };

  async function handleOpenEvidence(storageKey: string) {
    if (!paymentOperationsApi) {
      return;
    }

    const blob = await paymentOperationsApi.downloadAttachment(storageKey);
    openAttachmentBlob(blob, formatAttachmentLabel(storageKey));
    setEvidenceMessage(`Opened payment evidence ${formatAttachmentLabel(storageKey)}.`);
  }

  return (
    <DashboardPage>
      {!paymentOperationsApi ? (
        <Panel
          title="Payment Operations"
          description="Payment operations tools are unavailable in this preview client."
        />
      ) : null}

      {returnContextLabel && onReturnToContext ? (
        <div className="loan-return-banner">
          <div>
            <strong>Opened from {returnContextLabel}</strong>
            <span>Return to the notification context without losing the payment receipt handoff.</span>
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

      <DashboardGrid>
        <DashboardSectionCard
          title="Payment Operations Snapshot"
          description="Review member payment history, including normalized QR, school payment, and dispute receipts, before taking action on payment cases."
        >
          <div className="dashboard-stack">
            <DashboardMetricRow label="Members with payment cases" value={memberQueue.length.toLocaleString()} />
            <DashboardMetricRow
              label="Open payment cases"
              value={memberQueue.reduce((sum, item) => sum + item.openCases, 0).toLocaleString()}
            />
            <DashboardMetricRow
              label="Selected branch"
              value={selectedMember?.branchName ?? session.branchName ?? 'n/a'}
            />
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Payment Queue Focus"
          description="Select a member to inspect receipts and supporting evidence."
        >
          <div className="dashboard-stack">
            <DashboardMetricRow
              label="Selected member"
              value={selectedMember ? selectedMember.memberName : 'Not selected'}
              note={selectedMember ? selectedMember.customerId : 'Pick a member from the queue'}
            />
            <DashboardMetricRow
              label="Visible members"
              value={memberQueue.length.toLocaleString()}
              note="Payment activity records in this scope"
            />
          </div>
        </DashboardSectionCard>
      </DashboardGrid>

      <DashboardTableCard
        title="Payment Queue"
        description="Members with payment cases waiting for operations review."
        headers={['Customer', 'Branch', 'Open Cases', 'Latest Activity', 'Review']}
        rows={
          memberQueue.length > 0
            ? memberQueue.map((item) => [
                `${item.memberName} (${item.customerId})`,
                item.branchName ?? 'n/a',
                item.openCases.toLocaleString(),
                item.latestActivityAt ?? 'n/a',
                <button
                  key={item.memberId}
                  type="button"
                  className="loan-watchlist-link"
                  onClick={() => {
                    setSelectedMemberId(item.memberId);
                    setReceiptFilter('all');
                  }}
                >
                  Review payments
                </button>,
              ])
            : [['No payment operations queue yet', '-', '-', '-', '-']]
        }
      />

      {paymentOperationsApi && selectedMember ? (
        <Panel
          title={`${selectedMember.memberName} · Payment History`}
          description="Use normalized receipts to review merchant QR activity, confirmed payments, and related dispute cases for this member."
        >
          <div className="dashboard-summary-strip">
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Total receipts</span>
              <strong>{receiptSummary.total.toLocaleString()}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">QR payments</span>
              <strong>{receiptSummary.qr.toLocaleString()}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">School payments</span>
              <strong>{receiptSummary.school.toLocaleString()}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Dispute receipts</span>
              <strong>{receiptSummary.disputes.toLocaleString()}</strong>
            </div>
          </div>

          <div className="loan-filter-row">
            {[
              { id: 'all', label: `All (${receiptSummary.total})` },
              { id: 'qr_payment', label: `QR (${receiptSummary.qr})` },
              { id: 'school_payment', label: `School (${receiptSummary.school})` },
              { id: 'payment_dispute', label: 'Disputes' },
              { id: 'failed_transfer', label: 'Failed Transfers' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={
                  receiptFilter === filter.id ? 'loan-filter-chip active' : 'loan-filter-chip'
                }
                onClick={() => setReceiptFilter(filter.id as ReceiptFilter)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <SimpleTable
            headers={['Receipt Type', 'Title', 'Reference', 'Amount', 'Status', 'Recorded', 'Evidence']}
            rows={filteredReceipts.map((item) => [
              formatLabel(item.receiptType),
              item.title,
              item.transactionReference ?? 'n/a',
              formatMoney(item.amount, item.currency),
              formatLabel(item.status),
              item.recordedAt ?? 'n/a',
              item.attachments.length > 0
                ? item.attachments.map((attachment) => (
                    <div
                      key={attachment}
                      style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                      <span>{formatAttachmentLabel(attachment)}</span>
                      <button
                        type="button"
                        className="loan-watchlist-link"
                        onClick={() => void handleOpenEvidence(attachment)}
                      >
                        Open
                      </button>
                    </div>
                  ))
                : 'No evidence',
            ])}
            emptyState={{
              title: 'No receipts in this filter',
              description: 'Switch the receipt filter or review another member to see payment activity.',
            }}
          />

          {evidenceMessage ? <p className="muted">{evidenceMessage}</p> : null}

          <SimpleTable
            headers={['Metric A', 'Value A', 'Metric B', 'Value B']}
            rows={[
              [
                'Open Cases',
                selectedMember.openCases.toLocaleString(),
                'Total Receipts',
                selectedMember.totalReceipts.toLocaleString(),
              ],
              [
                'QR Payments',
                selectedMember.qrPayments.toLocaleString(),
                'School Payments',
                selectedMember.schoolPayments.toLocaleString(),
              ],
              [
                'Dispute Receipts',
                selectedMember.disputeReceipts.toLocaleString(),
                'Phone',
                selectedMember.phone ?? 'n/a',
              ],
            ]}
            emptyState={{
              title: 'No payment summary available',
              description: 'The selected member does not have summarized payment activity in the current scope.',
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

function formatMoney(amount?: number, currency?: string) {
  if (typeof amount !== 'number') {
    return 'n/a';
  }

  return `${currency ?? 'ETB'} ${amount.toLocaleString()}`;
}

function compareDateString(left?: string, right?: string) {
  return new Date(left ?? 0).getTime() - new Date(right ?? 0).getTime();
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
