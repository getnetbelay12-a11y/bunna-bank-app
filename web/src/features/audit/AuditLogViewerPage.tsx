import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { AuditLogItem, NotificationCategory } from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';
import {
  AuditTargetActionLink,
  getAuditCategory,
  getAuditTarget,
  openAuditTarget,
  type AuditCategory,
} from './auditNavigation';

type AuditLogViewerPageProps = {
  session: AdminSession;
  initialEntity?: string;
  initialEntityType?: string;
  initialEntityId?: string;
  initialActionFilter?: string;
  returnContextLabel?: string;
  onReturnToContext?: () => void;
  onOpenLoan?: (loanId: string) => void;
  onOpenKycMember?: (memberId: string) => void;
  onOpenSupportChat?: (conversationId: string) => void;
  onOpenNotificationCategory?: (category: NotificationCategory) => void;
  onOpenAutopayOperation?: (operationId: string) => void;
};

type AuditCategoryFilter = 'all' | AuditCategory;
type AuditTimeFocus = 'all' | 'today' | 'last7Days' | 'highSignal' | 'actionable';
type OnboardingReviewAuditFilters = {
  actorId: string;
  memberId: string;
  status: string;
  approvalReasonCode: string;
  dateFrom: string;
  dateTo: string;
  currentOnly: boolean;
};

export function AuditLogViewerPage({
  session,
  initialEntity,
  initialEntityType,
  initialEntityId,
  initialActionFilter,
  returnContextLabel,
  onReturnToContext,
  onOpenLoan,
  onOpenKycMember,
  onOpenSupportChat,
  onOpenNotificationCategory,
  onOpenAutopayOperation,
}: AuditLogViewerPageProps) {
  const { auditApi, dashboardApi, serviceRequestApi } = useAppClient();
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [onboardingReviewItems, setOnboardingReviewItems] = useState<AuditLogItem[]>([]);
  const [securityReviewActionState, setSecurityReviewActionState] = useState<
    Record<string, { pending?: boolean; message?: string; error?: string }>
  >({});
  const [auditVerificationResults, setAuditVerificationResults] = useState<
    Record<string, { isValid: boolean; recomputedDigest: string; auditDigest: string }>
  >({});
  const [activeFilter, setActiveFilter] = useState<AuditCategoryFilter>('all');
  const [activeTimeFocus, setActiveTimeFocus] = useState<AuditTimeFocus>('all');
  const [activeActionFilter, setActiveActionFilter] = useState(initialActionFilter ?? '');
  const [stepUpFailureReasonFilter, setStepUpFailureReasonFilter] = useState('');
  const [stepUpWatchThreshold, setStepUpWatchThreshold] = useState(2);
  const [onboardingReviewFilters, setOnboardingReviewFilters] = useState<OnboardingReviewAuditFilters>({
    actorId: '',
    memberId: initialEntityType === 'member' && initialEntityId ? initialEntityId : '',
    status: '',
    approvalReasonCode: '',
    dateFrom: '',
    dateTo: '',
    currentOnly: true,
  });
  const isEntityDrilldown = Boolean(initialEntityType && initialEntityId);

  useEffect(() => {
    let cancelled = false;

    const loadAudit = initialEntityType && initialEntityId
      ? auditApi.getEntityAuditTrail(initialEntityType, initialEntityId)
      : auditApi.getByEntity(session.role);

    void loadAudit.then((result) => {
      if (!cancelled) {
        setItems(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [auditApi, initialEntityId, initialEntityType, session.role]);

  useEffect(() => {
    if (auditApi.getOnboardingReviewDecisions == null) {
      setOnboardingReviewItems([]);
      return;
    }

    let cancelled = false;
    const query = {
      actorId: onboardingReviewFilters.actorId || undefined,
      memberId:
        onboardingReviewFilters.memberId ||
        (initialEntityType === 'member' && initialEntityId ? initialEntityId : undefined),
      status: onboardingReviewFilters.status || undefined,
      approvalReasonCode: onboardingReviewFilters.approvalReasonCode || undefined,
      dateFrom: onboardingReviewFilters.dateFrom || undefined,
      dateTo: onboardingReviewFilters.dateTo || undefined,
      currentOnly: onboardingReviewFilters.currentOnly,
    };
    void auditApi
      .getOnboardingReviewDecisions(query)
      .then((result) => {
        if (!cancelled) {
          setOnboardingReviewItems(result);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [auditApi, initialEntityId, initialEntityType, onboardingReviewFilters]);

  useEffect(() => {
    setActiveFilter('all');
    setActiveTimeFocus('all');
  }, [initialEntityId, initialEntityType]);

  useEffect(() => {
    setActiveActionFilter(initialActionFilter ?? '');
  }, [initialActionFilter]);

  useEffect(() => {
    setOnboardingReviewFilters((current) => ({
      ...current,
      memberId: initialEntityType === 'member' && initialEntityId ? initialEntityId : current.memberId,
    }));
  }, [initialEntityId, initialEntityType]);

  const counts = useMemo(
    () => ({
      all: items.length,
      loan: items.filter((item) => getAuditCategory(item) === 'loan').length,
      kyc: items.filter((item) => getAuditCategory(item) === 'kyc').length,
      support: items.filter((item) => getAuditCategory(item) === 'support').length,
      notification: items.filter((item) => getAuditCategory(item) === 'notification').length,
      autopay: items.filter((item) => getAuditCategory(item) === 'autopay').length,
      security: items.filter((item) => getAuditCategory(item) === 'security').length,
    }),
    [items],
  );

  const categoryFilteredItems =
    activeFilter === 'all'
      ? items
      : items.filter((item) => getAuditCategory(item) === activeFilter);
  const actionFilteredItems = activeActionFilter
    ? categoryFilteredItems.filter((item) => item.action === activeActionFilter)
    : categoryFilteredItems;
  const actionableItems = actionFilteredItems.filter(
    (item) => getAuditTarget(item).kind !== 'none',
  );
  const filteredItems =
    activeTimeFocus === 'all'
      ? actionFilteredItems
      : activeTimeFocus === 'actionable'
        ? actionableItems
      : actionFilteredItems.filter((item) => matchesTimeFocus(item, activeTimeFocus));
  const filteredCounts = useMemo(
    () => ({
      loan: filteredItems.filter((item) => getAuditCategory(item) === 'loan').length,
      kyc: filteredItems.filter((item) => getAuditCategory(item) === 'kyc').length,
      support: filteredItems.filter((item) => getAuditCategory(item) === 'support').length,
      notification: filteredItems.filter((item) => getAuditCategory(item) === 'notification').length,
      autopay: filteredItems.filter((item) => getAuditCategory(item) === 'autopay').length,
      security: filteredItems.filter((item) => getAuditCategory(item) === 'security').length,
      actionable: filteredItems.filter((item) => getAuditTarget(item).kind !== 'none').length,
    }),
    [filteredItems],
  );
  const timeCounts = useMemo(
    () => ({
      all: actionFilteredItems.length,
      today: actionFilteredItems.filter((item) => matchesTimeFocus(item, 'today')).length,
      last7Days: actionFilteredItems.filter((item) => matchesTimeFocus(item, 'last7Days')).length,
      highSignal: actionFilteredItems.filter((item) => matchesTimeFocus(item, 'highSignal')).length,
      actionable: actionableItems.length,
    }),
    [actionFilteredItems, actionableItems],
  );

  const orderedItems = useMemo(
    () => [...filteredItems].sort(compareAuditPriority),
    [filteredItems],
  );

  const prioritizedItems =
    initialEntity && orderedItems.some((item) => item.entity === initialEntity)
      ? [
          ...orderedItems.filter((item) => item.entity === initialEntity),
          ...orderedItems.filter((item) => item.entity !== initialEntity),
        ]
      : orderedItems;
  const topActionableItem = prioritizedItems.find(
    (item) => getAuditTarget(item).kind !== 'none',
  );
  const onboardingReviewAuditItems =
    onboardingReviewItems.length > 0
      ? onboardingReviewItems
      : prioritizedItems.filter(isOnboardingReviewAudit);
  const stepUpFailureItems = useMemo(() => {
    const securityItems = prioritizedItems.filter(isStepUpFailureAudit);
    if (!stepUpFailureReasonFilter) {
      return securityItems;
    }

    return securityItems.filter((item) => getStepUpFailureReasonCode(item) === stepUpFailureReasonFilter);
  }, [prioritizedItems, stepUpFailureReasonFilter]);
  const stepUpFailureReasonCodes = useMemo(
    () =>
      Array.from(
        new Set(
          prioritizedItems
            .filter(isStepUpFailureAudit)
            .map((item) => getStepUpFailureReasonCode(item))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [prioritizedItems],
  );
  const repeatedStepUpFailureWatchlist = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const grouped = new Map<
      string,
      {
        actor: string;
        actorRole?: string;
        entity: string;
        entityId?: string;
        count: number;
        latestTimestamp: string;
        reasonCodes: Set<string>;
        auditIds: string[];
      }
    >();

    prioritizedItems
      .filter(isStepUpFailureAudit)
      .filter((item) => {
        const parsed = parseAuditTimestamp(item.timestamp);
        return parsed != null && now - parsed.getTime() <= sevenDaysMs;
      })
      .forEach((item) => {
        const key = `${item.actor}::${item.entity}`;
        const existing = grouped.get(key);
        const reasonCode = getStepUpFailureReasonCode(item);
        if (existing) {
          existing.count += 1;
          if (item.timestamp > existing.latestTimestamp) {
            existing.latestTimestamp = item.timestamp;
          }
          if (reasonCode) {
            existing.reasonCodes.add(reasonCode);
          }
          existing.auditIds.push(item.auditId);
          return;
        }

        grouped.set(key, {
          actor: item.actor,
          actorRole: item.actorRole,
          entity: item.entity,
          entityId: item.entityId,
          count: 1,
          latestTimestamp: item.timestamp,
          reasonCodes: new Set(reasonCode ? [reasonCode] : []),
          auditIds: [item.auditId],
        });
      });

    return Array.from(grouped.values())
      .filter((item) => item.count >= stepUpWatchThreshold)
      .sort((left, right) => right.count - left.count || right.latestTimestamp.localeCompare(left.latestTimestamp));
  }, [prioritizedItems, stepUpWatchThreshold]);
  const showOnboardingReviewFilters =
    auditApi.getOnboardingReviewDecisions != null &&
    (activeFilter === 'all' || activeFilter === 'kyc' || isEntityDrilldown);
  const canCreateSecurityReview = ['admin', 'head_office_manager', 'head_office_officer'].includes(
    session.role,
  );

  const handleExportOnboardingReviewAudit = async () => {
    if (auditApi.exportOnboardingReviewDecisions == null) {
      return;
    }

    const blob = await auditApi.exportOnboardingReviewDecisions({
      actorId: onboardingReviewFilters.actorId || undefined,
      memberId:
        onboardingReviewFilters.memberId ||
        (initialEntityType === 'member' && initialEntityId ? initialEntityId : undefined),
      status: onboardingReviewFilters.status || undefined,
      approvalReasonCode: onboardingReviewFilters.approvalReasonCode || undefined,
      dateFrom: onboardingReviewFilters.dateFrom || undefined,
      dateTo: onboardingReviewFilters.dateTo || undefined,
      currentOnly: onboardingReviewFilters.currentOnly,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildOnboardingAuditExportFilename(onboardingReviewFilters);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintOnboardingReviewAudit = () => {
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900');
    if (reportWindow == null) {
      return;
    }

    const reportHtml = buildOnboardingAuditPrintHtml({
      generatedAt: new Date().toISOString(),
      filters: onboardingReviewFilters,
      items: onboardingReviewAuditItems,
    });

    reportWindow.document.open();
    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const handleOpenEvidenceReference = async (storageKey: string) => {
    if (dashboardApi.getProtectedDocumentBlob == null) {
      return;
    }

    const blob = await dashboardApi.getProtectedDocumentBlob(storageKey);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleVerifyAuditDigest = async (auditId: string) => {
    if (auditApi.verifyAuditLog == null) {
      return;
    }

    const result = await auditApi.verifyAuditLog(auditId);
    setAuditVerificationResults((current) => ({
      ...current,
      [auditId]: {
        isValid: result.isValid,
        recomputedDigest: result.recomputedDigest,
        auditDigest: result.auditDigest,
      },
    }));
  };

  const handleCreateSecurityReview = async (item: (typeof repeatedStepUpFailureWatchlist)[number]) => {
    if (!serviceRequestApi?.createSecurityReview || !item.entityId) {
      return;
    }

    const stateKey = `${item.actor}::${item.entityId}`;
    setSecurityReviewActionState((current) => ({
      ...current,
      [stateKey]: {
        pending: true,
        error: undefined,
        message: undefined,
      },
    }));

    try {
      const created = await serviceRequestApi.createSecurityReview({
        memberId: item.entityId,
        memberLabel: item.entity,
        reviewerLabel: item.actor,
        failureCount: item.count,
        escalationThreshold: stepUpWatchThreshold,
        latestFailureAt: item.latestTimestamp,
        reasonCodes: Array.from(item.reasonCodes),
        auditIds: item.auditIds,
      });

      setSecurityReviewActionState((current) => ({
        ...current,
        [stateKey]: {
          pending: false,
          error: undefined,
          message: `Security review ${created.id} created.`,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Security review creation failed.';
      setSecurityReviewActionState((current) => ({
        ...current,
        [stateKey]: {
          pending: false,
          error: message,
          message: undefined,
        },
      }));
    }
  };

  return (
    <div className="page-stack">
      {returnContextLabel && onReturnToContext ? (
        <div className="loan-return-banner">
          <div>
            <p className="eyebrow">Dashboard Context</p>
            <strong>Opened from {returnContextLabel}</strong>
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
      {activeActionFilter ? (
        <div className="loan-return-banner">
          <div>
            <p className="eyebrow">Audit Scope</p>
            <strong>Filtered to {formatAuditActionLabel(activeActionFilter)}</strong>
          </div>
          <button
            type="button"
            className="loan-return-button"
            onClick={() => setActiveActionFilter('')}
          >
            Clear scope
          </button>
        </div>
      ) : null}
      <Panel
        title="Audit Log Viewer"
        description="Inspect actor, entity, and before/after snapshots for sensitive business actions."
      >
        <div className="dashboard-summary-strip">
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">
              {isEntityDrilldown ? 'Scoped entity' : 'Priority entity'}
            </span>
            <strong>
              {initialEntityType && initialEntityId
                ? `${initialEntityType}:${initialEntityId}`
                : prioritizedItems[0]?.entity ?? 'No priority entity'}
            </strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Priority action</span>
            <strong>{prioritizedItems[0]?.action.replace(/_/g, ' ') ?? 'No audit action'}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Actor</span>
            <strong>{prioritizedItems[0]?.actor ?? 'Not available'}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Timestamp</span>
            <strong>{prioritizedItems[0]?.timestamp ?? 'Not available'}</strong>
          </div>
        </div>
        {!isEntityDrilldown ? (
          <>
            <div className="loan-filter-row">
              {[
                { id: 'all', label: `All (${counts.all})` },
                { id: 'loan', label: `Loans (${counts.loan})` },
                { id: 'kyc', label: `KYC (${counts.kyc})` },
                { id: 'security', label: `Security (${counts.security})` },
                { id: 'support', label: `Support (${counts.support})` },
                { id: 'notification', label: `Notifications (${counts.notification})` },
                { id: 'autopay', label: `AutoPay (${counts.autopay})` },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={activeFilter === filter.id ? 'loan-filter-chip active' : 'loan-filter-chip'}
                  onClick={() => setActiveFilter(filter.id as AuditCategory)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="loan-filter-row">
              {[
                { id: 'all', label: `All Time (${timeCounts.all})` },
                { id: 'today', label: `Today (${timeCounts.today})` },
                { id: 'last7Days', label: `Last 7 Days (${timeCounts.last7Days})` },
                { id: 'highSignal', label: `High-Signal (${timeCounts.highSignal})` },
                { id: 'actionable', label: `Actionable Only (${timeCounts.actionable})` },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={activeTimeFocus === filter.id ? 'loan-filter-chip active' : 'loan-filter-chip'}
                  onClick={() => setActiveTimeFocus(filter.id as AuditTimeFocus)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
        <div className="dashboard-summary-strip">
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">
              {isEntityDrilldown ? 'Scoped audit events' : 'Active audit view'}
            </span>
            <strong>
              {isEntityDrilldown
                ? `${prioritizedItems.length.toLocaleString()} events`
                : `${formatAuditCategoryLabel(activeFilter)} • ${formatTimeFocusLabel(activeTimeFocus)} (${filteredItems.length})`}
            </strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Loan actions</span>
            <strong>{filteredCounts.loan.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">KYC changes</span>
            <strong>{filteredCounts.kyc.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Support events</span>
            <strong>{filteredCounts.support.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Security events</span>
            <strong>{filteredCounts.security.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Notification events</span>
            <strong>{filteredCounts.notification.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">AutoPay actions</span>
            <strong>{filteredCounts.autopay.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Actionable items</span>
            <strong>{filteredCounts.actionable.toLocaleString()}</strong>
          </div>
        </div>
        {topActionableItem ? (
          <div className="loan-summary-strip">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                openAuditTarget(topActionableItem, {
                  onOpenLoan,
                  onOpenKycMember,
                  onOpenSupportChat,
                  onOpenNotificationCategory,
                  onOpenAutopayOperation,
                })
              }
            >
              Open top high-signal item
            </button>
          </div>
        ) : null}
        {(activeFilter === 'all' || activeFilter === 'security' || activeFilter === 'kyc') &&
        stepUpFailureItems.length > 0 ? (
          <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <strong>Step-Up Failures</strong>
              <label style={{ display: 'grid', gap: 6, minWidth: 260 }}>
                <span>Failure reason</span>
                <select
                  value={stepUpFailureReasonFilter}
                  onChange={(event) => setStepUpFailureReasonFilter(event.target.value)}
                >
                  <option value="">All failure reasons</option>
                  {stepUpFailureReasonCodes.map((reasonCode) => (
                    <option key={reasonCode} value={reasonCode}>
                      {reasonCode}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              }}
            >
              {stepUpFailureItems.slice(0, 4).map((item) => {
                const reasonCode = getStepUpFailureReasonCode(item);
                return (
                  <Panel
                    key={item.auditId}
                    title={`Step-Up Failure: ${reasonCode ?? 'unknown_reason'}`}
                    description={`${item.timestamp} • ${item.actorRole ?? 'unknown role'} • ${item.actor}`}
                  >
                    <div style={{ display: 'grid', gap: 8 }}>
                      <span>Member: {item.entity}</span>
                      <span>Reason code: {reasonCode ?? 'Not recorded'}</span>
                      <span>Audit digest: {item.auditDigest ?? 'Not recorded'}</span>
                      <span>
                        Purpose: {getStepUpFailurePurpose(item) ?? 'Not recorded'}
                      </span>
                      {renderAuditOpenAction(item, {
                        onOpenLoan,
                        onOpenKycMember,
                        onOpenSupportChat,
                        onOpenNotificationCategory,
                        onOpenAutopayOperation,
                      })}
                    </div>
                  </Panel>
                );
              })}
            </div>
          </div>
        ) : null}
        {(activeFilter === 'all' || activeFilter === 'security') &&
        repeatedStepUpFailureWatchlist.length > 0 ? (
          <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <strong>Step-Up Failure Watchlist</strong>
              <label style={{ display: 'grid', gap: 6, minWidth: 180 }}>
                <span>Escalation threshold</span>
                <select
                  value={String(stepUpWatchThreshold)}
                  onChange={(event) => setStepUpWatchThreshold(Number(event.target.value))}
                >
                  <option value="2">2+ failures / 7 days</option>
                  <option value="3">3+ failures / 7 days</option>
                  <option value="5">5+ failures / 7 days</option>
                </select>
              </label>
            </div>
            {canCreateSecurityReview ? (
              <p className="muted" style={{ margin: 0 }}>
                Flagging creates a tracked `security_review` service request and blocks duplicate open cases for the same member.
              </p>
            ) : null}
            <SimpleTable
              headers={[
                'Reviewer',
                'Member',
                'Failures (7d)',
                'Reason codes',
                'Latest',
                'Open case',
                canCreateSecurityReview ? 'Security review' : 'Status',
              ]}
              rows={repeatedStepUpFailureWatchlist.map((item) => [
                `${item.actor}${item.actorRole ? ` (${item.actorRole})` : ''}`,
                item.entity,
                item.count.toString(),
                Array.from(item.reasonCodes).join(', ') || 'not recorded',
                item.latestTimestamp,
                item.entityId && onOpenKycMember ? (
                  <button
                    type="button"
                    className="loan-watchlist-link"
                    onClick={() => onOpenKycMember(item.entityId!)}
                  >
                    Open KYC
                  </button>
                ) : 'No linked workspace',
                (() => {
                  const stateKey = `${item.actor}::${item.entityId ?? item.entity}`;
                  const actionState = securityReviewActionState[stateKey];
                  if (!canCreateSecurityReview) {
                    return 'Senior review role required';
                  }

                  if (!item.entityId) {
                    return 'No linked member';
                  }

                  return (
                    <div key={`security-review-${stateKey}`} style={{ display: 'grid', gap: 6 }}>
                      <button
                        type="button"
                        className="loan-watchlist-link"
                        onClick={() => void handleCreateSecurityReview(item)}
                        disabled={actionState?.pending}
                      >
                        {actionState?.pending ? 'Creating...' : 'Flag for security review'}
                      </button>
                      {actionState?.message ? <span>{actionState.message}</span> : null}
                      {actionState?.error ? (
                        <span style={{ color: '#b91c1c' }}>{actionState.error}</span>
                      ) : null}
                    </div>
                  );
                })(),
              ])}
              emptyState={{
                title: 'No repeated step-up failures',
                description: 'Repeated high-risk step-up denials over the last 7 days will appear here.',
              }}
            />
          </div>
        ) : null}
        {showOnboardingReviewFilters ? (
          <div
            style={{
              display: 'grid',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                padding: 16,
                borderRadius: 16,
                background: '#f8fafc',
                border: '1px solid #d8e3f5',
              }}
            >
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Reviewer ID</span>
                <input
                  value={onboardingReviewFilters.actorId}
                  onChange={(event) =>
                    setOnboardingReviewFilters((current) => ({
                      ...current,
                      actorId: event.target.value,
                    }))
                  }
                  placeholder="staff id"
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Member ID</span>
                <input
                  value={onboardingReviewFilters.memberId}
                  onChange={(event) =>
                    setOnboardingReviewFilters((current) => ({
                      ...current,
                      memberId: event.target.value,
                    }))
                  }
                  placeholder="member id"
                  disabled={initialEntityType === 'member' && Boolean(initialEntityId)}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Status</span>
                <select
                  value={onboardingReviewFilters.status}
                  onChange={(event) =>
                    setOnboardingReviewFilters((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="">All statuses</option>
                  <option value="approved">Approved</option>
                  <option value="needs_action">Needs action</option>
                  <option value="review_in_progress">Review in progress</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Reason code</span>
                <select
                  value={onboardingReviewFilters.approvalReasonCode}
                  onChange={(event) =>
                    setOnboardingReviewFilters((current) => ({
                      ...current,
                      approvalReasonCode: event.target.value,
                    }))
                  }
                >
                  <option value="">All reason codes</option>
                  <option value="official_source_verified">official_source_verified</option>
                  <option value="manual_document_review">manual_document_review</option>
                  <option value="customer_profile_corrected">customer_profile_corrected</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Date from</span>
                <input
                  type="date"
                  value={onboardingReviewFilters.dateFrom ? onboardingReviewFilters.dateFrom.slice(0, 10) : ''}
                  onChange={(event) =>
                    setOnboardingReviewFilters((current) => ({
                      ...current,
                      dateFrom: event.target.value ? `${event.target.value}T00:00:00.000Z` : '',
                    }))
                  }
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Date to</span>
                <input
                  type="date"
                  value={onboardingReviewFilters.dateTo ? onboardingReviewFilters.dateTo.slice(0, 10) : ''}
                  onChange={(event) =>
                    setOnboardingReviewFilters((current) => ({
                      ...current,
                      dateTo: event.target.value ? `${event.target.value}T23:59:59.999Z` : '',
                    }))
                  }
                />
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', alignSelf: 'end' }}>
                <input
                  type="checkbox"
                  checked={onboardingReviewFilters.currentOnly}
                  onChange={(event) =>
                    setOnboardingReviewFilters((current) => ({
                      ...current,
                      currentOnly: event.target.checked,
                    }))
                  }
                />
                <span>Current decisions only</span>
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handlePrintOnboardingReviewAudit()}
              >
                Print onboarding audit summary
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void handleExportOnboardingReviewAudit()}
              >
                Export onboarding audit CSV
              </button>
            </div>
          </div>
        ) : null}
        {onboardingReviewAuditItems.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              marginBottom: 20,
            }}
          >
            {onboardingReviewAuditItems.slice(0, 4).map((item) => {
              const summary = getOnboardingReviewAuditSummary(item);
              const verification = auditVerificationResults[item.auditId];
              return (
                <Panel
                  key={item.auditId}
                  title={`KYC Decision: ${summary.statusLabel}`}
                  description={`${item.timestamp} • ${item.actorRole ?? 'unknown role'} • ${item.actor}`}
                >
                  <div style={{ display: 'grid', gap: 8 }}>
                    <span>Member: {item.entity}</span>
                    <span>
                      Decision lifecycle: v{summary.decisionVersion ?? 'n/a'} /{' '}
                      {summary.isCurrentDecision ? 'current' : 'superseded'}
                    </span>
                    {summary.supersedesAuditId ? (
                      <span>Supersedes: {summary.supersedesAuditId}</span>
                    ) : null}
                    {summary.supersededByAuditId ? (
                      <span>Superseded by: {summary.supersededByAuditId}</span>
                    ) : null}
                    <span>
                      Supersession reason: {summary.supersessionReasonCode ?? 'initial decision'}
                    </span>
                    <span>
                      Supersession acknowledgments:{' '}
                      {summary.acknowledgedSupersessionFields.length > 0
                        ? summary.acknowledgedSupersessionFields.join(', ')
                        : 'none'}
                    </span>
                    <span>Audit digest: {item.auditDigest ?? 'Not recorded'}</span>
                    {verification ? (
                      <span>
                        Digest verification:{' '}
                        {verification.isValid ? 'valid' : 'invalid'} / recomputed{' '}
                        {verification.recomputedDigest}
                      </span>
                    ) : null}
                    <span>Reason code: {summary.approvalReasonCode ?? 'Not recorded'}</span>
                    <span>
                      Blocking mismatches:{' '}
                      {summary.blockingMismatchFields.length > 0
                        ? summary.blockingMismatchFields.join(', ')
                        : 'none'}
                    </span>
                    <span>
                      Acknowledged:{' '}
                      {summary.acknowledgedMismatchFields.length > 0
                        ? summary.acknowledgedMismatchFields.join(', ')
                        : 'none'}
                    </span>
                    <span>
                      Policy: {summary.policyVersion ?? 'unknown'} / roles{' '}
                      {summary.blockingMismatchApprovalRoles.length > 0
                        ? summary.blockingMismatchApprovalRoles.join(', ')
                        : 'not recorded'}
                    </span>
                    <span>
                      Evidence references:{' '}
                      {summary.evidenceReferences.length > 0
                        ? summary.evidenceReferences.join(', ')
                        : 'not recorded'}
                    </span>
                    {summary.evidenceDocuments.length > 0 ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {summary.evidenceDocuments.map((document) => (
                          <button
                            key={document.storageKey}
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => void handleOpenEvidenceReference(document.storageKey)}
                          >
                            Open {document.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => void handleVerifyAuditDigest(item.auditId)}
                      >
                        Verify audit digest
                      </button>
                    </div>
                    <span>
                      Evidence hashes:{' '}
                      {summary.evidenceHashes.length > 0
                        ? summary.evidenceHashes.join(', ')
                        : 'not recorded'}
                    </span>
                    {summary.supersessionDiffs.length > 0 ? (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 12,
                          background: '#fff7ed',
                          border: '1px solid #fdba74',
                          display: 'grid',
                          gap: 8,
                        }}
                      >
                        <strong>Decision diff</strong>
                        {summary.supersessionDiffs.map((diff) => (
                          <div key={diff.field}>
                            <div>{diff.field}</div>
                            <div>Previous: {diff.previousValue || 'empty'}</div>
                            <div>Current: {diff.nextValue || 'empty'}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: '#f8fafc',
                        border: '1px solid #d8e3f5',
                      }}
                    >
                      <strong>Justification</strong>
                      <div style={{ marginTop: 6 }}>
                        {summary.approvalJustification ?? 'No justification recorded.'}
                      </div>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        ) : null}
        <SimpleTable
          headers={['Actor', 'Action', 'Entity', 'Signal', 'Actionable', 'Timestamp', 'Open workspace']}
          rows={prioritizedItems.map((item) => [
            item.actor,
            item.action.replace(/_/g, ' '),
            item.entity,
            isHighSignalAuditAction(item.action) ? 'High' : 'Normal',
            getAuditTarget(item).kind !== 'none' ? 'Yes' : 'No',
            item.timestamp,
            renderAuditOpenAction(item, {
              onOpenLoan,
              onOpenKycMember,
              onOpenSupportChat,
              onOpenNotificationCategory,
              onOpenAutopayOperation,
            }),
          ])}
          emptyState={{
            title: 'No audit events in this slice',
            description:
              activeFilter === 'all'
                ? 'There are no audit events for the current time filter.'
                : `There are no ${activeFilter} audit events for the current time filter.`,
          }}
        />
      </Panel>
    </div>
  );
}

function renderAuditOpenAction(
  item: { entity: string; action: string },
  handlers: {
    onOpenLoan?: (loanId: string) => void;
    onOpenKycMember?: (memberId: string) => void;
    onOpenSupportChat?: (conversationId: string) => void;
    onOpenNotificationCategory?: (category: NotificationCategory) => void;
    onOpenAutopayOperation?: (operationId: string) => void;
  },
) {
  return <AuditTargetActionLink item={item} handlers={handlers} />;
}

function isOnboardingReviewAudit(item: AuditLogItem) {
  return item.action === 'onboarding_review_updated';
}

function isStepUpFailureAudit(item: AuditLogItem) {
  return item.action === 'staff_step_up_verification_failed';
}

function getStepUpFailureReasonCode(item: AuditLogItem) {
  const after = asRecord(item.after);
  return typeof after?.reasonCode === 'string' ? after.reasonCode : undefined;
}

function getStepUpFailurePurpose(item: AuditLogItem) {
  const after = asRecord(item.after);
  return typeof after?.purpose === 'string' ? after.purpose : undefined;
}

function getOnboardingReviewAuditSummary(item: AuditLogItem) {
  const after = asRecord(item.after);
  const reviewPolicySnapshot = asRecord(after?.reviewPolicySnapshot);
  const evidenceReferences = asRecord(after?.evidenceReferences);
  const evidenceDocuments = [
    buildEvidenceDocument('Fayda front', evidenceReferences?.faydaFrontStorageKey),
    buildEvidenceDocument('Fayda back', evidenceReferences?.faydaBackStorageKey),
    buildEvidenceDocument('Selfie', evidenceReferences?.selfieStorageKey),
  ].filter((value): value is { label: string; storageKey: string } => value != null);
  const evidenceHashes = [
    formatEvidenceReference('faydaFrontSha256', evidenceReferences?.faydaFrontSha256Hash),
    formatEvidenceReference('faydaBackSha256', evidenceReferences?.faydaBackSha256Hash),
    formatEvidenceReference('selfieSha256', evidenceReferences?.selfieSha256Hash),
  ].filter((value): value is string => Boolean(value));

  return {
    statusLabel: typeof after?.status === 'string' ? after.status.replace(/_/g, ' ') : 'updated',
    decisionVersion: item.decisionVersion,
    isCurrentDecision: item.isCurrentDecision ?? false,
    supersedesAuditId: item.supersedesAuditId,
    supersededByAuditId: item.supersededByAuditId,
    supersessionReasonCode:
      typeof asRecord(after?.supersession)?.reasonCode === 'string'
        ? (asRecord(after?.supersession)?.reasonCode as string)
        : undefined,
    acknowledgedSupersessionFields: asStringArray(
      asRecord(after?.supersession)?.acknowledgedFields,
    ),
    supersessionDiffs: asDiffArray(asRecord(after?.supersession)?.changedFields),
    approvalReasonCode:
      typeof after?.approvalReasonCode === 'string' ? after.approvalReasonCode : undefined,
    approvalJustification:
      typeof after?.approvalJustification === 'string' ? after.approvalJustification : undefined,
    blockingMismatchFields: asStringArray(after?.blockingMismatchFields),
    acknowledgedMismatchFields: asStringArray(after?.acknowledgedMismatchFields),
    policyVersion:
      typeof reviewPolicySnapshot?.policyVersion === 'string'
        ? reviewPolicySnapshot.policyVersion
        : undefined,
    blockingMismatchApprovalRoles: asStringArray(
      reviewPolicySnapshot?.blockingMismatchApprovalRoles,
    ),
    evidenceReferences: [
      formatEvidenceReference('faydaFront', evidenceReferences?.faydaFrontStorageKey),
      formatEvidenceReference('faydaBack', evidenceReferences?.faydaBackStorageKey),
      formatEvidenceReference('selfie', evidenceReferences?.selfieStorageKey),
      formatEvidenceReference('method', evidenceReferences?.extractionMethod),
    ].filter((value): value is string => Boolean(value)),
    evidenceDocuments,
    evidenceHashes,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function asDiffArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => item != null)
    .map((item) => ({
      field: typeof item.field === 'string' ? item.field : 'unknown',
      previousValue:
        typeof item.previousValue === 'string' ? item.previousValue : String(item.previousValue ?? ''),
      nextValue:
        typeof item.nextValue === 'string' ? item.nextValue : String(item.nextValue ?? ''),
    }));
}

function buildOnboardingAuditExportFilename(filters: OnboardingReviewAuditFilters) {
  const suffixParts = [
    filters.status || 'all-statuses',
    filters.approvalReasonCode || 'all-reasons',
    filters.currentOnly ? 'current-only' : 'all-decisions',
    filters.dateFrom ? filters.dateFrom.slice(0, 10) : 'start',
    filters.dateTo ? filters.dateTo.slice(0, 10) : 'end',
  ];

  return `onboarding-review-audit-${suffixParts.join('-')}.csv`;
}

function buildOnboardingAuditPrintHtml(input: {
  generatedAt: string;
  filters: OnboardingReviewAuditFilters;
  items: AuditLogItem[];
}) {
  const filterSummary = [
    `Reviewer ID: ${input.filters.actorId || 'All'}`,
    `Member ID: ${input.filters.memberId || 'All'}`,
    `Status: ${input.filters.status || 'All'}`,
    `Reason code: ${input.filters.approvalReasonCode || 'All'}`,
    `Date from: ${input.filters.dateFrom ? input.filters.dateFrom.slice(0, 10) : 'Open'}`,
    `Date to: ${input.filters.dateTo ? input.filters.dateTo.slice(0, 10) : 'Open'}`,
    `Current only: ${input.filters.currentOnly ? 'Yes' : 'No'}`,
  ];
  const sections = input.items.map((item) => {
    const summary = getOnboardingReviewAuditSummary(item);
    return `
      <section class="decision-card">
        <h2>${escapeHtml(summary.statusLabel)}</h2>
        <p><strong>Audit ID:</strong> ${escapeHtml(item.auditId)}</p>
        <p><strong>Decision lifecycle:</strong> v${escapeHtml(String(summary.decisionVersion ?? 'n/a'))} / ${escapeHtml(summary.isCurrentDecision ? 'current' : 'superseded')}</p>
        <p><strong>Supersedes:</strong> ${escapeHtml(summary.supersedesAuditId ?? 'none')}</p>
        <p><strong>Superseded by:</strong> ${escapeHtml(summary.supersededByAuditId ?? 'none')}</p>
        <p><strong>Supersession reason:</strong> ${escapeHtml(summary.supersessionReasonCode ?? 'initial decision')}</p>
        <p><strong>Supersession acknowledgments:</strong> ${escapeHtml(summary.acknowledgedSupersessionFields.join(', ') || 'none')}</p>
        <p><strong>Audit digest:</strong> ${escapeHtml(item.auditDigest ?? 'Not recorded')}</p>
        <p><strong>Timestamp:</strong> ${escapeHtml(item.timestamp)}</p>
        <p><strong>Reviewer:</strong> ${escapeHtml(item.actor)} (${escapeHtml(item.actorRole ?? 'unknown role')})</p>
        <p><strong>Member:</strong> ${escapeHtml(item.entity)}</p>
        <p><strong>Reason code:</strong> ${escapeHtml(summary.approvalReasonCode ?? 'Not recorded')}</p>
        <p><strong>Blocking mismatches:</strong> ${escapeHtml(summary.blockingMismatchFields.join(', ') || 'none')}</p>
        <p><strong>Acknowledged mismatches:</strong> ${escapeHtml(summary.acknowledgedMismatchFields.join(', ') || 'none')}</p>
        <p><strong>Policy version:</strong> ${escapeHtml(summary.policyVersion ?? 'unknown')}</p>
        <p><strong>Allowed approval roles:</strong> ${escapeHtml(summary.blockingMismatchApprovalRoles.join(', ') || 'not recorded')}</p>
        <p><strong>Evidence references:</strong> ${escapeHtml(summary.evidenceReferences.join(', ') || 'not recorded')}</p>
        <p><strong>Evidence hashes:</strong> ${escapeHtml(summary.evidenceHashes.join(', ') || 'not recorded')}</p>
        <p><strong>Decision diff:</strong> ${escapeHtml(summary.supersessionDiffs.map((diff) => `${diff.field}: ${diff.previousValue || 'empty'} -> ${diff.nextValue || 'empty'}`).join(' | ') || 'none')}</p>
        <div class="justification-box">
          <strong>Justification</strong>
          <p>${escapeHtml(summary.approvalJustification ?? 'No justification recorded.')}</p>
        </div>
      </section>
    `;
  });

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Onboarding Review Audit Summary</title>
    <style>
      body { font-family: Georgia, "Times New Roman", serif; margin: 32px; color: #0f172a; }
      h1 { margin: 0 0 8px; font-size: 28px; }
      .meta { margin-bottom: 24px; color: #475569; }
      .filters { margin: 16px 0 24px; padding: 16px; border: 1px solid #cbd5e1; background: #f8fafc; }
      .filters p { margin: 4px 0; }
      .decision-card { page-break-inside: avoid; border: 1px solid #cbd5e1; padding: 18px; margin-bottom: 18px; }
      .decision-card h2 { margin: 0 0 12px; font-size: 22px; }
      .decision-card p { margin: 6px 0; line-height: 1.45; }
      .justification-box { margin-top: 14px; padding: 12px; background: #f8fafc; border: 1px solid #d8e3f5; }
      @media print { body { margin: 18px; } }
    </style>
  </head>
  <body>
    <h1>Onboarding Review Audit Summary</h1>
    <div class="meta">Generated at ${escapeHtml(input.generatedAt)} • ${input.items.length} decision(s)</div>
    <div class="filters">
      ${filterSummary.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
    </div>
    ${sections.join('')}
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEvidenceReference(label: string, value: unknown) {
  return typeof value === 'string' && value.length > 0 ? `${label}:${value}` : null;
}

function buildEvidenceDocument(label: string, value: unknown) {
  return typeof value === 'string' && value.length > 0
    ? { label, storageKey: value }
    : null;
}

function formatAuditCategoryLabel(category: AuditCategoryFilter) {
  if (category === 'all') {
    return 'All events';
  }

  if (category === 'kyc') {
    return 'KYC';
  }

  if (category === 'autopay') {
    return 'AutoPay';
  }

  if (category === 'security') {
    return 'Security';
  }

  if (category === 'notification') {
    return 'Notifications';
  }

  if (category === 'support') {
    return 'Support';
  }

  return 'Loans';
}

function formatAuditActionLabel(action: string) {
  if (action === 'unsupported_security_review_metrics_contract_detected') {
    return 'unsupported security-review metrics contract events';
  }

  return action.replace(/_/g, ' ');
}

function formatTimeFocusLabel(focus: AuditTimeFocus) {
  if (focus === 'today') {
    return 'Today';
  }

  if (focus === 'last7Days') {
    return 'Last 7 days';
  }

  if (focus === 'highSignal') {
    return 'High-signal';
  }

  if (focus === 'actionable') {
    return 'Actionable only';
  }

  return 'All time';
}

function matchesTimeFocus(
  item: { action: string; timestamp: string },
  focus: Exclude<AuditTimeFocus, 'all'>,
) {
  if (focus === 'highSignal') {
    return isHighSignalAuditAction(item.action);
  }

  const timestamp = parseAuditTimestamp(item.timestamp);

  if (!timestamp) {
    return false;
  }

  const now = new Date();
  const ageMs = now.getTime() - timestamp.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (focus === 'today') {
    return ageMs >= 0 && ageMs <= oneDayMs;
  }

  return ageMs >= 0 && ageMs <= 7 * oneDayMs;
}

function parseAuditTimestamp(value: string) {
  const parsed = Date.parse(value.includes('T') ? value : value.replace(' ', 'T'));

  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed);
}

function isHighSignalAuditAction(action: string) {
  const normalized = action.toLowerCase();

  return [
    'approve',
    'rejected',
    'reject',
    'lock',
    'unlock',
    'paused',
    'reenabled',
    'escalat',
    'overdue',
    'return_for_correction',
    'reminder',
    'failed',
    'disburse',
  ].some((token) => normalized.includes(token));
}

function compareAuditPriority(
  left: { action: string; timestamp: string; entity: string },
  right: { action: string; timestamp: string; entity: string },
) {
  const leftHighSignal = isHighSignalAuditAction(left.action) ? 1 : 0;
  const rightHighSignal = isHighSignalAuditAction(right.action) ? 1 : 0;

  if (leftHighSignal !== rightHighSignal) {
    return rightHighSignal - leftHighSignal;
  }

  const leftTimestamp = parseAuditTimestamp(left.timestamp)?.getTime() ?? 0;
  const rightTimestamp = parseAuditTimestamp(right.timestamp)?.getTime() ?? 0;

  if (leftTimestamp !== rightTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  const entityComparison = left.entity.localeCompare(right.entity);

  if (entityComparison !== 0) {
    return entityComparison;
  }

  return left.action.localeCompare(right.action);
}
