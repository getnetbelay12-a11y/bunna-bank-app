import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { LoanCustomerProfile, LoanQueueDetail } from '../../core/api/contracts';
import { ConsoleKpiStrip } from '../../shared/components/ConsoleKpiStrip';
import { CriticalActionStrip } from '../../shared/components/CriticalActionStrip';
import { DashboardPage } from '../../shared/components/BankingDashboard';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';
import { RecommendationPanel } from '../recommendations/RecommendationPanel';

type LoanMonitoringPageProps = {
  initialLoanId?: string;
  returnContextLabel?: string;
  onReturnToContext?: () => void;
};

type QueueFilter =
  | 'all'
  | 'critical_aging'
  | 'correction_required'
  | 'approval_ready'
  | 'needs_escalation';

export function LoanMonitoringPage({
  initialLoanId,
  returnContextLabel,
  onReturnToContext,
}: LoanMonitoringPageProps) {
  const { loanMonitoringApi } = useAppClient();
  const [loanRows, setLoanRows] = useState<Array<{
    loanId: string;
    memberId: string;
    customerId: string;
    memberName: string;
    amount: string;
    level: string;
    status: string;
    deficiency: string;
    nextMoves: string;
    deficiencyCount: number;
    readyToApprove: boolean;
    needsEscalation: boolean;
    aging: string;
    agingTone: 'normal' | 'warning' | 'critical';
    updatedAtRaw: string;
    updatedAt: string;
  }>>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [selectedLoanDetail, setSelectedLoanDetail] = useState<LoanQueueDetail | null>(null);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<LoanCustomerProfile | null>(null);
  const [busyLoanId, setBusyLoanId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [correctionReasonText, setCorrectionReasonText] = useState(
    'Upload latest income proof\nReplace blurred Fayda back image',
  );
  const [actionNoteText, setActionNoteText] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  async function refreshQueue() {
    const items = await loanMonitoringApi?.getPendingLoans();
    if (!items) {
      return;
    }

    const nextRows = items.map((item) => ({
      loanId: item.loanId,
      memberId: item.memberId,
      customerId: item.customerId,
      memberName: item.memberName,
      amount: `ETB ${item.amount.toLocaleString()}`,
      level: titleCase(item.level),
      status: titleCase(item.status),
      deficiency:
        item.deficiencyReasons.length > 0
          ? item.deficiencyReasons.join(', ')
          : 'No open deficiency',
      nextMoves:
        item.availableActions.length > 0
          ? item.availableActions.map(formatActionLabel).join(', ')
          : 'No next action available',
      deficiencyCount: item.deficiencyReasons.length,
      readyToApprove: item.availableActions.includes('approve'),
      needsEscalation: item.availableActions.includes('forward'),
      aging: formatAging(item.updatedAt),
      agingTone: resolveAgingTone(item.updatedAt),
      updatedAtRaw: item.updatedAt ?? '',
      updatedAt: formatDateTime(item.updatedAt),
    }))
      .sort(compareLoanRowsByUrgency);

    setLoanRows(nextRows);
    setSelectedLoanId((current) => {
      if (initialLoanId && nextRows.some((item) => item.loanId === initialLoanId)) {
        return initialLoanId;
      }

      return nextRows.some((item) => item.loanId === current)
        ? current
        : nextRows[0]?.loanId || '';
    });
  }

  useEffect(() => {
    void refreshQueue().catch(() => undefined);
  }, [initialLoanId, loanMonitoringApi]);

  useEffect(() => {
    if (!loanMonitoringApi) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshQueue().catch(() => undefined);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [initialLoanId, loanMonitoringApi]);

  useEffect(() => {
    if (!selectedLoanId || !loanMonitoringApi) {
      setSelectedLoanDetail(null);
      setSelectedCustomerProfile(null);
      return;
    }

    let active = true;

    void loanMonitoringApi
      .getLoanDetail(selectedLoanId)
      .then((detail) => {
        if (active) {
          setSelectedLoanDetail(detail);
        }
      })
      .catch(() => {
        if (active) {
          setSelectedLoanDetail(null);
        }
      });

    void loanMonitoringApi
      .getCustomerProfile(selectedLoanId)
      .then((profile) => {
        if (active) {
          setSelectedCustomerProfile(profile);
        }
      })
      .catch(() => {
        if (active) {
          setSelectedCustomerProfile(null);
        }
      });

    return () => {
      active = false;
    };
  }, [loanMonitoringApi, selectedLoanId]);

  useEffect(() => {
    if (!selectedLoanDetail) {
      return;
    }

    setCorrectionReasonText(
      selectedLoanDetail.deficiencyReasons.length > 0
        ? selectedLoanDetail.deficiencyReasons.join('\n')
        : 'Upload latest income proof\nReplace blurred Fayda back image',
    );
    setActionNoteText('');
  }, [selectedLoanDetail]);

  const filteredLoanRows = useMemo(
    () => loanRows.filter((loan) => matchesQueueFilter(loan, queueFilter)),
    [loanRows, queueFilter],
  );
  const selectedLoan = useMemo(
    () =>
      filteredLoanRows.find((loan) => loan.loanId === selectedLoanId) ?? filteredLoanRows[0],
    [filteredLoanRows, selectedLoanId],
  );
  const focusLoan = useMemo(
    () => resolveFocusAction(filteredLoanRows, queueFilter),
    [filteredLoanRows, queueFilter],
  );
  const queueFilterCounts = useMemo(
    () => ({
      all: loanRows.length,
      critical_aging: loanRows.filter((loan) => matchesQueueFilter(loan, 'critical_aging')).length,
      correction_required: loanRows.filter((loan) => matchesQueueFilter(loan, 'correction_required')).length,
      approval_ready: loanRows.filter((loan) => matchesQueueFilter(loan, 'approval_ready')).length,
      needs_escalation: loanRows.filter((loan) => matchesQueueFilter(loan, 'needs_escalation')).length,
    }),
    [loanRows],
  );
  const availableActions = useMemo(
    () => selectedLoanDetail?.availableActions ?? [],
    [selectedLoanDetail],
  );
  const pipelineCounts = useMemo(
    () => ({
      intake: loanRows.length,
      correction: loanRows.filter((loan) => loan.deficiencyCount > 0).length,
      approval: loanRows.filter((loan) => loan.readyToApprove).length,
      escalation: loanRows.filter((loan) => loan.needsEscalation).length,
    }),
    [loanRows],
  );

  useEffect(() => {
    if (filteredLoanRows.length === 0) {
      setSelectedLoanId('');
      return;
    }

    if (!filteredLoanRows.some((loan) => loan.loanId === selectedLoanId)) {
      setSelectedLoanId(filteredLoanRows[0].loanId);
    }
  }, [filteredLoanRows, selectedLoanId]);

  useEffect(() => {
    if (!actionFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActionFeedback(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [actionFeedback]);

  async function handleAction(
    action: 'review' | 'forward' | 'approve' | 'return_for_correction',
  ) {
    if (!selectedLoan || !loanMonitoringApi) {
      return;
    }

    const deficiencyReasons =
      action === 'return_for_correction'
        ? correctionReasonText
            .split('\n')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : undefined;

    if (
      action === 'return_for_correction' &&
      (!deficiencyReasons || deficiencyReasons.length === 0)
    ) {
      return;
    }

    setActionFeedback(null);
    setBusyLoanId(selectedLoan.loanId);
    try {
      const result = await loanMonitoringApi.processAction(selectedLoan.loanId, {
        action,
        comment: resolveActionComment(action, actionNoteText),
        deficiencyReasons,
      });
      await refreshQueue();
      try {
        const refreshedDetail = await loanMonitoringApi.getLoanDetail(selectedLoan.loanId);
        setSelectedLoanDetail(refreshedDetail);
      } catch {
        setSelectedLoanDetail(null);
      }
      setActionFeedback({
        tone: 'success',
        message: buildActionSuccessMessage(selectedLoan.loanId, action, result.status),
      });
      setActionNoteText('');
    } catch (error) {
      setActionFeedback({
        tone: 'error',
        message: buildActionErrorMessage(error),
      });
    } finally {
      setBusyLoanId(null);
    }
  }

  return (
    <DashboardPage>
      <div className="console-focus-page loans-page">
        <section className="console-command-grid">
          <article className="console-command-card console-command-card-primary">
            <div className="console-command-copy">
              <span className="eyebrow">Loan command</span>
              <h3>Move the queue faster by separating correction work, approval-ready cases, and escalations.</h3>
              <p>Give staff a clear workflow view before they drop into case detail so the queue feels operational instead of procedural.</p>
            </div>
            <div className="console-command-stats">
              <div>
                <span>Queue size</span>
                <strong>{loanRows.length.toLocaleString()}</strong>
              </div>
              <div>
                <span>Approval ready</span>
                <strong>{pipelineCounts.approval.toLocaleString()}</strong>
              </div>
              <div>
                <span>Critical aging</span>
                <strong>{loanRows.filter((loan) => loan.agingTone === 'critical').length.toLocaleString()}</strong>
              </div>
              <div>
                <span>Focus case</span>
                <strong>{focusLoan?.loanId ?? 'No active focus'}</strong>
              </div>
            </div>
          </article>

          <article className="console-command-card console-command-card-warning">
            <span className="eyebrow">Priority signals</span>
            <h3>Workflow pressure</h3>
            <ul className="console-priority-list">
              <li>
                <span>Corrections</span>
                <strong>{loanRows.filter((loan) => loan.deficiencyCount > 0).length.toLocaleString()} loans still need documents or clarification.</strong>
              </li>
              <li>
                <span>Escalations</span>
                <strong>{pipelineCounts.escalation.toLocaleString()} cases need a higher-level review handoff.</strong>
              </li>
              <li>
                <span>Aging</span>
                <strong>{loanRows.filter((loan) => loan.agingTone === 'critical').length.toLocaleString()} cases are at critical response age.</strong>
              </li>
            </ul>
          </article>

          <article className="console-command-card console-command-card-secondary">
            <span className="eyebrow">Execution snapshot</span>
            <h3>Where staff should act</h3>
            <ol className="console-action-ladder">
              <li>
                <div>
                  <strong>{pipelineCounts.intake.toLocaleString()} submitted</strong>
                  <p>Review the full intake first to prevent correction work from hiding approval-ready cases.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>{pipelineCounts.correction.toLocaleString()} need correction</strong>
                  <p>Return incomplete files with explicit action notes before they age further.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>{pipelineCounts.approval.toLocaleString()} ready for approval</strong>
                  <p>Clear clean files quickly to show visible movement through the pipeline.</p>
                </div>
              </li>
            </ol>
          </article>
        </section>

        <ConsoleKpiStrip
          items={[
            { icon: 'CU', label: 'Customers', value: loanRows.length.toLocaleString(), trend: 'Loan queue', trendDirection: 'neutral' },
            { icon: 'LN', label: 'Loans', value: loanRows.length.toLocaleString(), trend: `${pipelineCounts.intake.toLocaleString()} submitted`, trendDirection: 'up' },
            { icon: 'SV', label: 'Savings', value: pipelineCounts.approval.toLocaleString(), trend: 'Approval ready', trendDirection: 'up' },
            { icon: 'AP', label: 'Approvals', value: pipelineCounts.approval.toLocaleString(), trend: 'Workflow ready', trendDirection: 'up' },
            { icon: 'AL', label: 'Alerts', value: pipelineCounts.escalation.toLocaleString(), trend: 'Needs escalation', trendDirection: 'down' },
          ]}
        />
        <CriticalActionStrip
          items={[
            { label: 'Overdue Loans', value: loanRows.filter((loan) => loan.agingTone === 'critical').length.toLocaleString(), tone: 'red' },
            { label: 'Missing Documents', value: loanRows.filter((loan) => loan.deficiencyCount > 0).length.toLocaleString(), tone: 'orange' },
            { label: 'Support Backlog', value: loanRows.filter((loan) => loan.needsEscalation).length.toLocaleString(), tone: 'red' },
            { label: 'Expiring Insurance', value: '0', tone: 'amber' },
          ]}
        />
        <RecommendationPanel
          memberId={selectedLoan?.memberId ?? ''}
          compact
          title="Loan Workflow Insights"
          description="Repayment support, top-up opportunity, and loan follow-up cues for staff."
        />
        <Panel
        title="Loan Monitoring"
        description="Filterable operational loan queue for branch, district, and head office staff."
        >
        {returnContextLabel && onReturnToContext ? (
          <div className="loan-return-banner">
            <div>
              <strong>Opened from {returnContextLabel}</strong>
              <span>Return to your dashboard context without losing the loan selection handoff.</span>
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
        {actionFeedback ? (
          <div className={`loan-action-banner loan-action-banner-${actionFeedback.tone}`}>
            <strong>
              {actionFeedback.tone === 'success' ? 'Workflow updated' : 'Action failed'}
            </strong>
            <span>{actionFeedback.message}</span>
          </div>
        ) : null}
        <div className="workflow-control-stack">
          <section className="workflow-surface-card">
            <div className="workflow-surface-header">
              <div>
                <span className="eyebrow">Queue filters</span>
                <h3>Focus the active loan queue</h3>
              </div>
              <span className="dashboard-summary-label">
                {filteredLoanRows.length.toLocaleString()} active
              </span>
            </div>
            <div className="recommendation-selector-row">
              {([
                ['all', 'All'],
                ['critical_aging', 'Critical Aging'],
                ['correction_required', 'Correction Required'],
                ['approval_ready', 'Approval Ready'],
                ['needs_escalation', 'Needs Escalation'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    queueFilter === value
                      ? 'recommendation-selector active'
                      : 'recommendation-selector'
                  }
                  onClick={() => setQueueFilter(value)}
                >
                  {label} ({queueFilterCounts[value].toLocaleString()})
                </button>
              ))}
            </div>
            <p className="loan-action-guidance">
              Viewing {filteredLoanRows.length.toLocaleString()} case
              {filteredLoanRows.length === 1 ? '' : 's'} in the{' '}
              {formatQueueFilterLabel(queueFilter)} queue view.
            </p>
          </section>

          <section className="workflow-surface-card">
            <div className="workflow-surface-header">
              <div>
                <span className="eyebrow">Pipeline posture</span>
                <h3>Stage balance</h3>
              </div>
            </div>
            <div className="loan-pipeline-visual">
              <div className="loan-pipeline-stage">
                <span>Intake</span>
                <strong>{pipelineCounts.intake.toLocaleString()}</strong>
              </div>
              <div className="loan-pipeline-stage">
                <span>Correction</span>
                <strong>{pipelineCounts.correction.toLocaleString()}</strong>
              </div>
              <div className="loan-pipeline-stage">
                <span>Approval</span>
                <strong>{pipelineCounts.approval.toLocaleString()}</strong>
              </div>
              <div className="loan-pipeline-stage">
                <span>Escalation</span>
                <strong>{pipelineCounts.escalation.toLocaleString()}</strong>
              </div>
            </div>
          </section>
        </div>
        {filteredLoanRows.length > 0 ? (
          <div className="dashboard-summary-strip">
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Queue View</span>
              <strong>
                {formatQueueFilterLabel(queueFilter)} · {filteredLoanRows.length.toLocaleString()}
              </strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Approval Ready</span>
              <strong>
                {filteredLoanRows
                  .filter((loan) => loan.readyToApprove)
                  .length.toLocaleString()}
              </strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Correction Required</span>
              <strong>
                {filteredLoanRows
                  .filter((loan) => loan.deficiencyCount > 0)
                  .length.toLocaleString()}
              </strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Critical Aging</span>
              <strong>
                {filteredLoanRows
                  .filter((loan) => loan.agingTone === 'critical')
                  .length.toLocaleString()}
              </strong>
            </div>
          </div>
        ) : null}
        <div className="workflow-control-stack workflow-control-stack-compact">
          {focusLoan ? (
            <section className="workflow-surface-card">
              <div className="workflow-surface-header">
                <div>
                  <span className="eyebrow">Recommended focus</span>
                  <h3>Priority case</h3>
                </div>
              </div>
              <div className="recommendation-selector-row">
                <button
                  type="button"
                  className="recommendation-selector active"
                  onClick={() => {
                    setSelectedLoanId(focusLoan.loanId);
                  }}
                >
                  {resolveFocusActionLabel(queueFilter, focusLoan)}
                </button>
              </div>
            </section>
          ) : null}
          <section className="workflow-surface-card">
            <div className="workflow-surface-header">
              <div>
                <span className="eyebrow">Workflow actions</span>
                <h3>Next step controls</h3>
              </div>
            </div>
            <div className="recommendation-selector-row">
              {availableActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className={
                    action === 'approve'
                      ? 'recommendation-selector active'
                      : 'recommendation-selector'
                  }
                  aria-label={`Run ${formatActionLabel(action)} action`}
                  disabled={!selectedLoan || busyLoanId === selectedLoan.loanId}
                  onClick={() => void handleAction(action)}
                >
                  {busyLoanId === selectedLoan?.loanId
                    ? 'Updating...'
                    : formatActionLabel(action)}
                </button>
              ))}
            </div>
          </section>
        </div>
        {selectedLoanDetail ? (
          <p className="loan-action-guidance">
            Available next actions: {availableActions.map(formatActionLabel).join(', ') || 'None'}.
          </p>
        ) : null}
        <div className="recommendation-selector-row workflow-case-selector">
          {filteredLoanRows.map((loan) => (
            <button
              key={loan.loanId}
              type="button"
              className={
                selectedLoanId === loan.loanId
                  ? 'recommendation-selector active'
                  : 'recommendation-selector'
              }
              onClick={() => setSelectedLoanId(loan.loanId)}
            >
              <span className="loan-selector-title">
                {loan.loanId} · {loan.memberName}
              </span>
              <span className="loan-selector-meta">
                <span className="loan-selector-chip">{loan.status}</span>
                <span
                  className={
                    loan.deficiencyCount > 0
                      ? 'loan-selector-chip warning'
                      : 'loan-selector-chip'
                  }
                >
                  {loan.deficiencyCount > 0
                    ? `${loan.deficiencyCount} correction item${loan.deficiencyCount === 1 ? '' : 's'}`
                    : 'No correction item'}
                </span>
                {loan.readyToApprove ? (
                  <span className="loan-selector-chip success">Approval ready</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
        {selectedLoanDetail ? (
          <div className="loan-detail-grid">
            <section className="loan-detail-card">
              <div className="loan-detail-card-header">
                <div>
                  <h3>Recommended Next Action</h3>
                  <p>{selectedLoanDetail.nextAction}</p>
                </div>
                <span className="loan-detail-badge">{titleCase(selectedLoanDetail.level)}</span>
              </div>
              <div className="loan-detail-meta">
                <div>
                  <span>Customer</span>
                  <strong>{selectedLoanDetail.customerId}</strong>
                </div>
                <div>
                  <span>Member</span>
                  <strong>{selectedLoanDetail.memberName}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{formatDateTime(selectedLoanDetail.updatedAt)}</strong>
                </div>
              </div>
              <div className="loan-detail-list">
                <span className="dashboard-summary-label">Open deficiency reasons</span>
                {selectedLoanDetail.deficiencyReasons.length > 0 ? (
                  <ul>
                    {selectedLoanDetail.deficiencyReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No open document or compliance deficiencies on this case.</p>
                )}
              </div>
              <div className="loan-correction-form">
                <label className="field-stack">
                  <span>Correction reasons for customer</span>
                  <textarea
                    rows={5}
                    value={correctionReasonText}
                    onChange={(event) => setCorrectionReasonText(event.target.value)}
                    placeholder="Enter one required correction per line"
                    disabled={busyLoanId === selectedLoanDetail.loanId}
                  />
                </label>
                <p className="muted">
                  One line per required document or action. These reasons will be sent back to the
                  customer and stored in workflow history.
                </p>
              </div>
              <div className="loan-action-note-form">
                <label className="field-stack">
                  <span>Staff action note</span>
                  <textarea
                    rows={4}
                    value={actionNoteText}
                    onChange={(event) => setActionNoteText(event.target.value)}
                    placeholder="Add review context, approval rationale, or follow-up instruction"
                    disabled={busyLoanId === selectedLoanDetail.loanId}
                  />
                </label>
                <p className="muted">
                  This note is optional, but when provided it is stored with the workflow action
                  and shown in the stage history.
                </p>
              </div>
            </section>
            <section className="loan-detail-card">
              <div className="loan-detail-card-header">
                <div>
                  <h3>Stage History</h3>
                  <p>Staff can see how the case moved, who acted, and what comment was left.</p>
                </div>
              </div>
              {selectedLoanDetail.history.length > 0 ? (
                <div className="loan-history-list">
                  {selectedLoanDetail.history.map((entry, index) => (
                    <article
                      key={`${entry.action}-${entry.createdAt ?? 'pending'}-${index}`}
                      className="loan-history-item"
                    >
                      <div className="loan-history-title-row">
                        <strong>{titleCase(entry.action)}</strong>
                        <span>{formatDateTime(entry.createdAt)}</span>
                      </div>
                      <p>
                        {titleCase(entry.fromStatus)} to {titleCase(entry.toStatus)} at{' '}
                        {titleCase(entry.level)}
                        {entry.actorRole ? ` by ${titleCase(entry.actorRole)}` : ''}
                      </p>
                      {entry.comment ? <p className="muted">{entry.comment}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No workflow history has been recorded for this loan yet.</p>
              )}
            </section>
            {selectedCustomerProfile ? (
              <section className="loan-detail-card">
                <div className="loan-detail-card-header">
                  <div>
                    <h3>Customer Loan Profile</h3>
                    <p>
                      Customer-level repayment, AutoPay, active-loan, and loyalty cues to guide
                      outreach, retention, or top-up decisions.
                    </p>
                  </div>
                  <span className="loan-detail-badge">
                    {selectedCustomerProfile.loyaltyTier.toUpperCase()} TIER
                  </span>
                </div>
                <div className="loan-detail-meta">
                  <div>
                    <span>Active loans</span>
                    <strong>{selectedCustomerProfile.activeLoans.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Closed loans</span>
                    <strong>{selectedCustomerProfile.closedLoans.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Rejected loans</span>
                    <strong>{selectedCustomerProfile.rejectedLoans.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Repayments (90d)</span>
                    <strong>{selectedCustomerProfile.repaymentCount90d.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Last repayment</span>
                    <strong>{formatDateTime(selectedCustomerProfile.lastRepaymentAt)}</strong>
                  </div>
                  <div>
                    <span>Repayment signal</span>
                    <strong>{titleCase(selectedCustomerProfile.repaymentSignal)}</strong>
                  </div>
                </div>
                <div className="dashboard-summary-strip dashboard-summary-strip-dense">
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Total borrowed</span>
                    <strong>ETB {selectedCustomerProfile.totalBorrowedAmount.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Closed amount</span>
                    <strong>ETB {selectedCustomerProfile.totalClosedAmount.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">AutoPay</span>
                    <strong>{selectedCustomerProfile.autopayEnabled ? 'Enabled' : 'Manual only'}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Open support</span>
                    <strong>{selectedCustomerProfile.openSupportCases.toLocaleString()}</strong>
                  </div>
                </div>
                <div className="loan-detail-list">
                  <span className="dashboard-summary-label">Next best action</span>
                  <p>{selectedCustomerProfile.nextBestAction}</p>
                  <p className="muted">{selectedCustomerProfile.offerCue}</p>
                  <p className="muted">
                    AutoPay services:{' '}
                    {selectedCustomerProfile.autopayServices.length > 0
                      ? selectedCustomerProfile.autopayServices.map(titleCase).join(', ')
                      : 'None'}
                  </p>
                  <p className="muted">
                    Active loan statuses:{' '}
                    {selectedCustomerProfile.activeLoanStatuses.length > 0
                      ? selectedCustomerProfile.activeLoanStatuses.map(titleCase).join(', ')
                      : 'None'}
                  </p>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
        <SimpleTable
          headers={[
            'Loan ID',
            'Member',
            'Status',
            'Aging',
            'Progress',
          ]}
          rows={filteredLoanRows.map((loan) => [
            loan.loanId,
            loan.memberName,
            loan.status,
            <span
              className={
                loan.agingTone === 'critical'
                  ? 'loan-selector-chip critical'
                  : loan.agingTone === 'warning'
                    ? 'loan-selector-chip warning'
                    : 'loan-selector-chip'
              }
            >
              {loan.aging}
            </span>,
            <div className="table-progress-cell">
              <span>{loan.readyToApprove ? 'Approval ready' : loan.deficiencyCount > 0 ? `${loan.deficiencyCount} missing` : 'In review'}</span>
              <div className="table-progress-track">
                <div
                  className="table-progress-fill"
                  style={{
                    width: `${loan.readyToApprove ? 100 : loan.deficiencyCount > 0 ? 42 : loan.needsEscalation ? 72 : 58}%`,
                  }}
                />
              </div>
            </div>,
          ])}
          emptyState={{
            title: 'No loans in this queue view',
            description: `There are no loans matching the ${formatQueueFilterLabel(queueFilter).toLowerCase()} filter right now.`,
          }}
        />
        </Panel>
      </div>
    </DashboardPage>
  );
}

function titleCase(value: string) {
  if (!value) {
    return 'Not available';
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDateTime(value?: string) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatAging(value?: string) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  const hours = Math.max(0, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60)));

  if (hours < 24) {
    return `${hours}h old`;
  }

  const days = Math.round(hours / 24);
  return `${days}d old`;
}

function resolveAgingTone(value?: string): 'normal' | 'warning' | 'critical' {
  if (!value) {
    return 'normal';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'normal';
  }

  const hours = Math.max(0, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60)));

  if (hours >= 72) {
    return 'critical';
  }

  if (hours >= 24) {
    return 'warning';
  }

  return 'normal';
}

function compareLoanRowsByUrgency(
  left: {
    agingTone: 'normal' | 'warning' | 'critical';
    updatedAtRaw: string;
    deficiencyCount: number;
  },
  right: {
    agingTone: 'normal' | 'warning' | 'critical';
    updatedAtRaw: string;
    deficiencyCount: number;
  },
) {
  const tonePriority = {
    critical: 0,
    warning: 1,
    normal: 2,
  } as const;

  const toneDelta = tonePriority[left.agingTone] - tonePriority[right.agingTone];

  if (toneDelta !== 0) {
    return toneDelta;
  }

  const leftTimestamp = parseTimestamp(left.updatedAtRaw);
  const rightTimestamp = parseTimestamp(right.updatedAtRaw);

  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp;
  }

  return right.deficiencyCount - left.deficiencyCount;
}

function parseTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function matchesQueueFilter(
  loan: {
    deficiencyCount: number;
    readyToApprove: boolean;
    needsEscalation: boolean;
    agingTone: 'normal' | 'warning' | 'critical';
  },
  filter: QueueFilter,
) {
  if (filter === 'critical_aging') {
    return loan.agingTone === 'critical';
  }

  if (filter === 'correction_required') {
    return loan.deficiencyCount > 0;
  }

  if (filter === 'approval_ready') {
    return loan.readyToApprove;
  }

  if (filter === 'needs_escalation') {
    return loan.needsEscalation;
  }

  return true;
}

function formatQueueFilterLabel(filter: QueueFilter) {
  if (filter === 'critical_aging') {
    return 'Critical Aging';
  }

  if (filter === 'correction_required') {
    return 'Correction Required';
  }

  if (filter === 'approval_ready') {
    return 'Approval Ready';
  }

  if (filter === 'needs_escalation') {
    return 'Needs Escalation';
  }

  return 'All';
}

function resolveFocusAction<
  T extends {
    loanId: string;
    agingTone: 'normal' | 'warning' | 'critical';
    deficiencyCount: number;
    readyToApprove: boolean;
    needsEscalation: boolean;
  },
>(loans: T[], filter: QueueFilter) {
  if (loans.length === 0) {
    return null;
  }

  if (filter === 'critical_aging') {
    return loans.find((loan) => loan.agingTone === 'critical') ?? loans[0];
  }

  if (filter === 'correction_required') {
    return loans.find((loan) => loan.deficiencyCount > 0) ?? loans[0];
  }

  if (filter === 'approval_ready') {
    return loans.find((loan) => loan.readyToApprove) ?? loans[0];
  }

  if (filter === 'needs_escalation') {
    return loans.find((loan) => loan.needsEscalation) ?? loans[0];
  }

  return loans[0];
}

function resolveFocusActionLabel(
  filter: QueueFilter,
  loan: {
    loanId: string;
  },
) {
  if (filter === 'critical_aging') {
    return `Open oldest critical case: ${loan.loanId}`;
  }

  if (filter === 'correction_required') {
    return `Open next correction case: ${loan.loanId}`;
  }

  if (filter === 'approval_ready') {
    return `Open next approval-ready case: ${loan.loanId}`;
  }

  if (filter === 'needs_escalation') {
    return `Open next escalation case: ${loan.loanId}`;
  }

  return `Open highest-priority case: ${loan.loanId}`;
}

function buildActionSuccessMessage(
  loanId: string,
  action: 'review' | 'forward' | 'approve' | 'return_for_correction',
  nextStatus: string,
) {
  const actionLabel =
    action === 'return_for_correction'
      ? 'returned for correction'
      : action === 'review'
        ? 'moved into active review'
        : action === 'forward'
          ? 'forwarded'
          : 'approved';

  return `Loan ${loanId} was ${actionLabel}. Current status: ${titleCase(nextStatus)}. The case history has been refreshed.`;
}

function buildActionErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return 'The workflow action could not be completed. Review permissions, queue status, or required deficiency reasons and try again.';
}

function resolveActionComment(
  action: 'review' | 'forward' | 'approve' | 'return_for_correction',
  note: string,
) {
  const trimmedNote = note.trim();

  if (trimmedNote.length > 0) {
    return trimmedNote;
  }

  if (action === 'approve') {
    return 'Approved from console queue.';
  }

  if (action === 'forward') {
    return 'Forwarded to the next review level from console queue.';
  }

  if (action === 'review') {
    return 'Marked as actively under review.';
  }

  return 'Returned to customer for correction with explicit deficiency reasons.';
}

function formatActionLabel(
  action: 'review' | 'forward' | 'approve' | 'return_for_correction',
) {
  if (action === 'return_for_correction') {
    return 'Return For Correction';
  }

  if (action === 'review') {
    return 'Mark Review';
  }

  return titleCase(action);
}
