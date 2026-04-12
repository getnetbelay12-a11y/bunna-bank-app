import { Suspense, lazy, useEffect, useState } from 'react';

import {
  AdminRole,
  canManageVoting,
  canViewAudit,
  getDefaultSessionSection,
  getManagerConsoleKind,
  getSessionConsoleBasePath,
  getSessionRoleLabel,
  getSessionScopeLabel,
  isSchoolSession,
  type AppSession,
} from '../../core/session';
import { FloatingSupportChatLauncher } from '../support/FloatingSupportChatLauncher';
import {
  applyAuditScopeToSearch,
  createAuditScopeForAction,
  createAuditScopeForEntity,
  createAuditScopeForEntityReference,
  readAuditScopeFromSearch,
  type AuditScope,
} from '../audit/auditNavigation';
import type { NotificationCategory } from '../../core/api/contracts';
import {
  getConsoleDefinition,
  type ConsoleNavKey,
  type ConsoleNavItem,
} from '../shared-layout/consoleConfig';

const prefetchedConsoleSections = new Set<ConsoleNavKey>();
const AuditLogViewerPage = lazy(() =>
  import('../audit/AuditLogViewerPage').then((module) => ({ default: module.AuditLogViewerPage })),
);
const DistrictAnalyticsPage = lazy(() =>
  import('../district-analytics/DistrictAnalyticsPage').then((module) => ({ default: module.DistrictAnalyticsPage })),
);
const BranchManagerDashboardPage = lazy(() =>
  import('../branch-dashboard/BranchManagerDashboardPage').then((module) => ({ default: module.BranchManagerDashboardPage })),
);
const CardOperationsPage = lazy(() =>
  import('../cards/CardOperationsPage').then((module) => ({ default: module.CardOperationsPage })),
);
const DistrictManagerDashboardPage = lazy(() =>
  import('../district-dashboard/DistrictManagerDashboardPage').then((module) => ({ default: module.DistrictManagerDashboardPage })),
);
const HeadOfficeManagerDashboardPage = lazy(() =>
  import('../head-office-dashboard/HeadOfficeManagerDashboardPage').then((module) => ({ default: module.HeadOfficeManagerDashboardPage })),
);
const LoanMonitoringPage = lazy(() =>
  import('../loan-monitoring/LoanMonitoringPage').then((module) => ({ default: module.LoanMonitoringPage })),
);
const AutopayOperationsPage = lazy(() =>
  import('../notifications/AutopayOperationsPage').then((module) => ({ default: module.AutopayOperationsPage })),
);
const ManagerNotificationCenterPage = lazy(() =>
  import('../notifications/ManagerNotificationCenterPage').then((module) => ({ default: module.ManagerNotificationCenterPage })),
);
const PaymentDisputesPage = lazy(() =>
  import('../payments/PaymentDisputesPage').then((module) => ({ default: module.PaymentDisputesPage })),
);
const PaymentOperationsPage = lazy(() =>
  import('../payments/PaymentOperationsPage').then((module) => ({ default: module.PaymentOperationsPage })),
);
const SchoolConsolePage = lazy(() =>
  import('../school-console/SchoolConsolePage').then((module) => ({ default: module.SchoolConsolePage })),
);
const SchoolSisConsolePage = lazy(() =>
  import('../school-console/SchoolSisConsolePage').then((module) => ({
    default: module.SchoolSisConsolePage,
  })),
);
const ServiceRequestsPage = lazy(() =>
  import('../service-requests/ServiceRequestsPage').then((module) => ({ default: module.ServiceRequestsPage })),
);
const SupportInboxPage = lazy(() =>
  import('../support/SupportInboxPage').then((module) => ({ default: module.SupportInboxPage })),
);
const AlertsPage = lazy(() =>
  import('../manager-pages/ManagerPageSections').then((module) => ({ default: module.AlertsPage })),
);
const BranchOverviewPage = lazy(() =>
  import('../manager-pages/ManagerPageSections').then((module) => ({ default: module.BranchOverviewPage })),
);
const KycAuditPage = lazy(() =>
  import('../manager-pages/ManagerPageSections').then((module) => ({ default: module.KycAuditPage })),
);
const KycVerificationPage = lazy(() =>
  import('../manager-pages/ManagerPageSections').then((module) => ({ default: module.KycVerificationPage })),
);
const MembersPage = lazy(() =>
  import('../manager-pages/ManagerPageSections').then((module) => ({ default: module.MembersPage })),
);
const RiskMonitoringPage = lazy(() =>
  import('../manager-pages/ManagerPageSections').then((module) => ({ default: module.RiskMonitoringPage })),
);
const ReportsHubPage = lazy(() =>
  import('../manager-pages/ManagerPageSections').then((module) => ({ default: module.ReportsHubPage })),
);
const StaffSnapshotPage = lazy(() =>
  import('../manager-pages/ManagerPageSections').then((module) => ({ default: module.StaffSnapshotPage })),
);
const SupportAnalyticsPage = lazy(() =>
  import('../manager-pages/ManagerPageSections').then((module) => ({ default: module.SupportAnalyticsPage })),
);
const VotingManagementPage = lazy(() =>
  import('../voting/VotingManagementPage').then((module) => ({ default: module.VotingManagementPage })),
);

type DashboardShellProps = {
  session: AppSession;
  initialActive?: ConsoleNavKey;
  onLogout?: () => void;
};

export function DashboardShell({
  session,
  initialActive,
  onLogout,
}: DashboardShellProps) {
  const schoolSession = isSchoolSession(session);
  const initialAuditScope =
    typeof window === 'undefined'
      ? { entity: undefined, entityType: undefined, entityId: undefined, action: undefined }
      : readAuditScopeFromSearch(window.location.search);
  type EntryContext =
    | 'dashboard'
    | 'risk'
    | 'autopayOps'
    | 'audit'
    | 'notifications'
    | null;
  const consoleDefinition = getConsoleDefinition(session);
  const [active, setActive] = useState<ConsoleNavKey>(() => {
    if (
      initialActive &&
      consoleDefinition.navItems.some((item) => item.key === initialActive)
    ) {
      return initialActive;
    }

    return (
      consoleDefinition.navItems.find(
        (item) => item.key === (getDefaultSessionSection(session) as ConsoleNavKey),
      )?.key ?? consoleDefinition.navItems[0]?.key ?? 'dashboard'
    );
  });
  const activeItem =
    consoleDefinition.navItems.find((item) => item.key === active) ??
    consoleDefinition.navItems[0];
  const consoleKind = isSchoolSession(session)
    ? 'school'
    : getManagerConsoleKind(session.role);
  const navSections = buildNavSections(consoleDefinition.navItems);
  const [selectedLoanId, setSelectedLoanId] = useState<string | undefined>(undefined);
  const [selectedSupportConversationId, setSelectedSupportConversationId] = useState<
    string | undefined
  >(undefined);
  const [selectedNotificationCategory, setSelectedNotificationCategory] = useState<
    NotificationCategory | undefined
  >(undefined);
  const [selectedKycMemberId, setSelectedKycMemberId] = useState<string | undefined>(undefined);
  const [selectedVoteId, setSelectedVoteId] = useState<string | undefined>(undefined);
  const [selectedAuditEntity, setSelectedAuditEntity] = useState<string | undefined>(
    () => initialAuditScope.entity,
  );
  const [selectedAuditEntityType, setSelectedAuditEntityType] = useState<string | undefined>(
    () => initialAuditScope.entityType,
  );
  const [selectedAuditEntityId, setSelectedAuditEntityId] = useState<string | undefined>(
    () => initialAuditScope.entityId,
  );
  const [selectedAuditAction, setSelectedAuditAction] = useState<string | undefined>(
    () => initialAuditScope.action,
  );
  const [selectedAutopayOperationId, setSelectedAutopayOperationId] = useState<string | undefined>(undefined);
  const [selectedPaymentMemberId, setSelectedPaymentMemberId] = useState<string | undefined>(
    undefined,
  );
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<
    'all' | 'qr_payment' | 'school_payment' | 'payment_dispute' | 'failed_transfer'
  >('all');
  const [loanEntryContext, setLoanEntryContext] = useState<EntryContext>(null);
  const [supportEntryContext, setSupportEntryContext] = useState<EntryContext>(null);
  const [notificationEntryContext, setNotificationEntryContext] = useState<EntryContext>(null);
  const [autopayEntryContext, setAutopayEntryContext] = useState<EntryContext>(null);
  const [kycEntryContext, setKycEntryContext] = useState<EntryContext>(null);
  const [votingEntryContext, setVotingEntryContext] = useState<EntryContext>(null);
  const [auditEntryContext, setAuditEntryContext] = useState<EntryContext>(null);
  const brandEyebrow = schoolSession ? 'School Console' : 'Bunna Bank';
  const brandSignature = schoolSession ? 'SCHOOL OPERATIONS' : 'BUNNA BANK';
  const brandTitle = schoolSession ? session.schoolName : consoleDefinition.title;
  const brandSubtitle = schoolSession
    ? `Student registry, billing, collections, and parent payment operations for ${session.branchName ?? 'the assigned branch'}.`
    : consoleDefinition.subtitle;
  const sidebarFooterCopy = schoolSession
    ? 'School-side registry, billing, collections, and onboarding.'
    : 'Live bank operations by role and scope.';
  const searchPlaceholder = schoolSession
    ? 'Search students, invoices, receipts'
    : 'Search customers, loans, chats';
  const searchLabel = schoolSession
    ? 'Search students, invoices, receipts'
    : 'Search customers, loans, chats';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const sectionPath = resolveConsolePath(session, active);
    const nextUrl = buildConsoleUrl(session, active, {
      entity: selectedAuditEntity,
      entityType: selectedAuditEntityType,
      entityId: selectedAuditEntityId,
      action: selectedAuditAction,
    });
    const nextSearch = new URL(nextUrl, window.location.origin).search;
    if (
      window.location.pathname !== sectionPath ||
      window.location.search !== nextSearch
    ) {
      window.history.replaceState({}, '', nextUrl);
    }
  }, [
    active,
    selectedAuditAction,
    selectedAuditEntity,
    selectedAuditEntityId,
    selectedAuditEntityType,
    session,
  ]);

  useEffect(() => {
    void prefetchConsoleSection(active);
  }, [active]);

  const openAuditWithScope = (auditScope: AuditScope, entryContext: EntryContext) => {
    setSelectedAuditEntity(auditScope.entity);
    setSelectedAuditEntityType(auditScope.entityType);
    setSelectedAuditEntityId(auditScope.entityId);
    setSelectedAuditAction(auditScope.action);
    setAuditEntryContext(entryContext);
    setActive('audit');
  };

  return (
    <div className={schoolSession ? 'app-shell school-console-shell' : 'app-shell'}>
      <aside className={schoolSession ? 'sidebar school-console-sidebar' : 'sidebar'}>
        <div className="brand-block">
          <div className="brand-header">
            <div className="brand-mark" aria-hidden="true">
              <img src="/bunna-bank-logo.png?v=20260316" alt="Bunna Bank logo" className="brand-logo" />
            </div>
            <div className="brand-copy">
              <p className="eyebrow">{brandEyebrow}</p>
              <h1>{brandTitle}</h1>
              <div className="brand-signature">{brandSignature}</div>
            </div>
          </div>
          <p className="brand-subtitle muted">{brandSubtitle}</p>
        </div>

        <nav className="sidebar-nav" aria-label="Manager navigation">
          {navSections.map((section) => (
            <div key={section.label} className="nav-group">
              <p className="sidebar-label">{section.label}</p>
              <div className="nav-list">
                {section.items.map((item) => {
                  const isActive = item.key === active;

                  return (
                    <button
                      key={item.key}
                      className={isActive ? 'nav-item active' : 'nav-item'}
                      onMouseEnter={() => {
                        void prefetchConsoleSection(item.key);
                      }}
                      onFocus={() => {
                        void prefetchConsoleSection(item.key);
                      }}
                      onClick={() => {
                        setActive(item.key);
                        if (item.key === 'audit') {
                          setSelectedAuditEntity(undefined);
                          setSelectedAuditEntityType(undefined);
                          setSelectedAuditEntityId(undefined);
                          setSelectedAuditAction(undefined);
                        }
                        setLoanEntryContext(null);
                        setSupportEntryContext(null);
                        setNotificationEntryContext(null);
                        setAutopayEntryContext(null);
                        setKycEntryContext(null);
                        setVotingEntryContext(null);
                        setAuditEntryContext(null);
                      }}
                      type="button"
                    >
                      <span className="nav-item-icon" aria-hidden="true">
                        {getNavIcon(item.key)}
                      </span>
                      <span className="nav-item-copy">
                        <span className="nav-item-label">{item.label}</span>
                        <span className="nav-item-description">{item.description}</span>
                      </span>
                      <span className="nav-item-chevron" aria-hidden="true">
                        {'>'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="muted">{sidebarFooterCopy}</p>
          {onLogout ? (
            <button className="nav-item nav-item-logout" onClick={onLogout} type="button">
              <span className="nav-item-icon" aria-hidden="true">
                <span className="nav-item-icon-dot danger" />
              </span>
              <span className="nav-item-copy">
                <span className="nav-item-label">Sign Out</span>
              </span>
              <span className="nav-item-chevron" aria-hidden="true">
                {'>'}
              </span>
            </button>
          ) : null}
        </div>
      </aside>

      <main className={schoolSession ? 'content school-console-content' : 'content'}>
        <header className={schoolSession ? 'topbar school-console-topbar' : 'topbar'}>
          <div className="topbar-heading">
            <p className="eyebrow">{consoleDefinition.summaryLabel}</p>
            <h2>{activeItem.label}</h2>
            <p className="muted">{activeItem.description}</p>
          </div>
          <div className="topbar-actions">
            <label className="topbar-search">
              <span className="topbar-search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                type="search"
                placeholder={searchPlaceholder}
                aria-label={searchLabel}
              />
            </label>
            {schoolSession ? (
              <div className="topbar-user-block topbar-user-block-school">
                <strong>School Workspace</strong>
                <div className="topbar-meta-row">
                  <span className="topbar-pill">Registry</span>
                  <span className="topbar-pill subtle">Billing and collections</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="topbar-alert-button"
                onClick={() => setActive('notifications')}
                aria-label="Open notifications"
              >
                <span aria-hidden="true">🔔</span>
                <span className="topbar-alert-label">Notifications</span>
                <span className="topbar-alert-badge">New</span>
              </button>
            )}
            <div className="topbar-user-block">
              <strong>{session.fullName}</strong>
              <div className="topbar-meta-row">
                <span className="topbar-pill">{getSessionRoleLabel(session)}</span>
                <span className="topbar-pill subtle">{getSessionScopeLabel(session)}</span>
              </div>
            </div>
          </div>
        </header>
        <Suspense fallback={<ConsolePageFallback />}>
        {!schoolSession && active === 'dashboard' && consoleKind === 'branch' ? (
          <BranchManagerDashboardPage
            session={session}
            onOpenLoan={(loanId) => {
              setSelectedLoanId(loanId);
              setLoanEntryContext('dashboard');
              setActive('loans');
            }}
            onOpenSupportChat={(conversationId) => {
              setSelectedSupportConversationId(conversationId);
              setSupportEntryContext('dashboard');
              setActive('support');
            }}
            onOpenAutopayOperation={(operationId) => {
              setSelectedAutopayOperationId(operationId);
              setAutopayEntryContext('dashboard');
              setActive('autopayOps');
            }}
            onOpenNotificationCategory={(category) => {
              setSelectedNotificationCategory(category);
              setNotificationEntryContext('dashboard');
              setActive('notifications');
            }}
            onOpenKycMember={(memberId) => {
              setSelectedKycMemberId(memberId);
              setKycEntryContext('dashboard');
              setActive('kyc');
            }}
          />
        ) : null}
        {!schoolSession && active === 'dashboard' && consoleKind === 'district' ? (
          <DistrictManagerDashboardPage
            session={session}
            onOpenLoan={(loanId) => {
              setSelectedLoanId(loanId);
              setLoanEntryContext('dashboard');
              setActive('loans');
            }}
            onOpenSupportChat={(conversationId) => {
              setSelectedSupportConversationId(conversationId);
              setSupportEntryContext('dashboard');
              setActive('support');
            }}
            onOpenAutopayOperation={(operationId) => {
              setSelectedAutopayOperationId(operationId);
              setAutopayEntryContext('dashboard');
              setActive('autopayOps');
            }}
            onOpenNotificationCategory={(category) => {
              setSelectedNotificationCategory(category);
              setNotificationEntryContext('dashboard');
              setActive('notifications');
            }}
            onOpenKycMember={(memberId) => {
              setSelectedKycMemberId(memberId);
              setKycEntryContext('dashboard');
              setActive('kyc');
            }}
          />
        ) : null}
        {!schoolSession && active === 'dashboard' && consoleKind === 'head_office' ? (
          <HeadOfficeManagerDashboardPage
            session={session}
            onOpenLoan={(loanId) => {
              setSelectedLoanId(loanId);
              setLoanEntryContext('dashboard');
              setActive('loans');
            }}
            onOpenLoansWorkspace={() => {
              setLoanEntryContext('dashboard');
              setActive('loans');
            }}
            onOpenSupportChat={(conversationId) => {
              setSelectedSupportConversationId(conversationId);
              setSupportEntryContext('dashboard');
              setActive('support');
            }}
            onOpenSupportWorkspace={() => {
              setSupportEntryContext('dashboard');
              setActive('support');
            }}
            onOpenAutopayOperation={(operationId) => {
              setSelectedAutopayOperationId(operationId);
              setAutopayEntryContext('dashboard');
              setActive('autopayOps');
            }}
            onOpenNotificationCategory={(category) => {
              setSelectedNotificationCategory(category);
              setNotificationEntryContext('dashboard');
              setActive('notifications');
            }}
            onOpenKycMember={(memberId) => {
              setSelectedKycMemberId(memberId);
              setKycEntryContext('dashboard');
              setActive('kyc');
            }}
            onOpenVote={(voteId) => {
              setSelectedVoteId(voteId);
              setVotingEntryContext('dashboard');
              setActive('voting');
            }}
            onOpenAuditEntity={(entity) => {
              openAuditWithScope(createAuditScopeForEntity(entity), 'dashboard');
            }}
            onOpenAuditWorkspace={(actionType) => {
              openAuditWithScope(createAuditScopeForAction(actionType), 'dashboard');
            }}
            onOpenRisk={() => {
              setActive('risk');
            }}
            onOpenServiceRequests={() => {
              setActive('serviceRequests');
            }}
          />
        ) : null}
        {schoolSession &&
        [
          'schoolDashboard',
          'schoolStudents',
          'schoolBilling',
          'schoolPayments',
          'schoolReports',
          'schoolCommunication',
          'schoolSettings',
        ].includes(active) ? (
          <SchoolSisConsolePage
            session={session}
            section={active as
              | 'schoolDashboard'
              | 'schoolStudents'
              | 'schoolBilling'
              | 'schoolPayments'
              | 'schoolReports'
              | 'schoolCommunication'
              | 'schoolSettings'}
            onNavigate={(nextSection) => {
              setActive(nextSection);
            }}
          />
        ) : null}
        {schoolSession && active === 'schoolConsole' ? (
          <SchoolConsolePage session={session} variant="school" />
        ) : null}
        {!schoolSession && active === 'schoolConsole' ? (
          <SchoolConsolePage
            session={{
              schoolId: 'bank_network',
              schoolName: 'Partner School Network',
              branchName: session.branchName ?? 'Head Office',
              districtName: session.districtName,
            }}
            variant="bank"
          />
        ) : null}
        {!schoolSession && active === 'members' ? <MembersPage session={session} /> : null}
        {!schoolSession && active === 'loans' ? (
          <LoanMonitoringPage
            initialLoanId={selectedLoanId}
            returnContextLabel={resolveReturnContextLabel(loanEntryContext, session)}
            onReturnToContext={
              loanEntryContext
                ? () => {
                    setActive(
                      loanEntryContext === 'dashboard'
                        ? 'dashboard'
                        : loanEntryContext === 'audit'
                          ? 'audit'
                          : 'risk',
                    );
                  }
                : undefined
            }
          />
        ) : null}
        {!schoolSession && active === 'autopayOps' ? (
          <AutopayOperationsPage
            initialOperationId={selectedAutopayOperationId}
            onOpenAuditEntity={(entityType, entityId) => {
              openAuditWithScope(
                createAuditScopeForEntityReference(entityType, entityId),
                'autopayOps',
              );
            }}
            onOpenNotificationCategory={(category) => {
              setSelectedNotificationCategory(category);
              setNotificationEntryContext('autopayOps');
              setActive('notifications');
            }}
            onReturnToContext={
              autopayEntryContext
                ? () => {
                    setActive(
                      autopayEntryContext === 'dashboard'
                        ? 'dashboard'
                        : autopayEntryContext === 'audit'
                          ? 'audit'
                          : 'risk',
                    );
                  }
                : undefined
            }
            returnContextLabel={resolveReturnContextLabel(autopayEntryContext, session)}
            session={session}
          />
        ) : null}
        {!schoolSession && active === 'kyc' ? (
          <KycVerificationPage
            initialMemberId={selectedKycMemberId}
            onReturnToContext={
              kycEntryContext
                ? () => {
                    setActive(
                      kycEntryContext === 'dashboard'
                        ? 'dashboard'
                        : kycEntryContext === 'audit'
                          ? 'audit'
                          : 'risk',
                    );
                  }
                : undefined
            }
            returnContextLabel={resolveReturnContextLabel(kycEntryContext, session)}
            session={session}
          />
        ) : null}
        {!schoolSession && active === 'staff' ? <StaffSnapshotPage session={session} /> : null}
        {!schoolSession && active === 'branches' ? <BranchOverviewPage session={session} /> : null}
        {!schoolSession && active === 'loanEscalations' ? <AlertsPage session={session} /> : null}
        {!schoolSession && active === 'kycAudits' ? <KycAuditPage session={session} /> : null}
        {!schoolSession && active === 'districtAnalytics' ? <DistrictAnalyticsPage session={session} /> : null}
        {!schoolSession && active === 'risk' ? (
          <RiskMonitoringPage
            onOpenAuditEntity={(entity) => {
              openAuditWithScope(createAuditScopeForEntity(entity), 'risk');
            }}
            onOpenKycMember={(memberId) => {
              setSelectedKycMemberId(memberId);
              setKycEntryContext('risk');
              setActive('kyc');
            }}
            onOpenLoan={(loanId) => {
              setSelectedLoanId(loanId);
              setLoanEntryContext('risk');
              setActive('loans');
            }}
            onOpenNotificationCategory={(category) => {
              setSelectedNotificationCategory(category);
              setNotificationEntryContext('risk');
              setActive('notifications');
            }}
            onOpenSupportChat={(conversationId) => {
              setSelectedSupportConversationId(conversationId);
              setSupportEntryContext('risk');
              setActive('support');
            }}
            session={session}
          />
        ) : null}
        {!schoolSession && active === 'notifications' ? (
          <ManagerNotificationCenterPage
            initialCategory={selectedNotificationCategory}
            onOpenPaymentReceipts={({ memberId, filter }) => {
              setSelectedPaymentMemberId(memberId);
              setSelectedPaymentFilter(filter);
              setNotificationEntryContext('notifications');
              setActive('paymentOps');
            }}
            onReturnToContext={
              notificationEntryContext
                ? () => {
                    setActive(
                      notificationEntryContext === 'dashboard'
                        ? 'dashboard'
                        : notificationEntryContext === 'autopayOps'
                          ? 'autopayOps'
                          : notificationEntryContext === 'audit'
                            ? 'audit'
                          : 'risk',
                    );
                  }
                : undefined
            }
            returnContextLabel={resolveReturnContextLabel(notificationEntryContext, session)}
            session={session}
          />
        ) : null}
        {!schoolSession && active === 'serviceRequests' ? <ServiceRequestsPage session={session} /> : null}
        {!schoolSession && active === 'paymentOps' ? (
          <PaymentOperationsPage
            session={session}
            initialMemberId={selectedPaymentMemberId}
            initialFilter={selectedPaymentFilter}
            returnContextLabel={
              notificationEntryContext === 'notifications' ? 'Notification Center' : undefined
            }
            onReturnToContext={
              notificationEntryContext === 'notifications'
                ? () => {
                    setActive('notifications');
                    setNotificationEntryContext(null);
                  }
                : undefined
            }
          />
        ) : null}
        {!schoolSession && active === 'paymentDisputes' ? <PaymentDisputesPage session={session} /> : null}
        {!schoolSession && active === 'cardOps' ? <CardOperationsPage session={session} /> : null}
        {!schoolSession && active === 'support' ? (
          <SupportInboxPage
            initialConversationId={selectedSupportConversationId}
            returnContextLabel={resolveReturnContextLabel(supportEntryContext, session)}
            onReturnToContext={
              supportEntryContext
                ? () => {
                    setActive(
                      supportEntryContext === 'dashboard'
                        ? 'dashboard'
                        : supportEntryContext === 'audit'
                          ? 'audit'
                          : 'risk',
                    );
                  }
                : undefined
            }
          />
        ) : null}
        {!schoolSession && active === 'reports' ? <ReportsHubPage session={session} /> : null}
        {!schoolSession && active === 'supportAnalytics' ? <SupportAnalyticsPage /> : null}
        {!schoolSession && active === 'voting' && canManageVoting(session.role) ? (
          <VotingManagementPage
            initialVoteId={selectedVoteId}
            onReturnToContext={
              votingEntryContext
                ? () => {
                    setActive(votingEntryContext === 'dashboard' ? 'dashboard' : 'risk');
                  }
                : undefined
            }
            returnContextLabel={resolveReturnContextLabel(votingEntryContext, session)}
            session={session}
          />
        ) : null}
        {!schoolSession && active === 'audit' && canViewAudit(session.role) ? (
          <AuditLogViewerPage
            initialEntity={selectedAuditEntity}
            initialActionFilter={selectedAuditAction}
            initialEntityId={selectedAuditEntityId}
            initialEntityType={selectedAuditEntityType}
            onOpenAutopayOperation={(operationId) => {
              setSelectedAutopayOperationId(operationId);
              setAutopayEntryContext('audit');
              setActive('autopayOps');
            }}
            onOpenKycMember={(memberId) => {
              setSelectedKycMemberId(memberId);
              setKycEntryContext('audit');
              setActive('kyc');
            }}
            onOpenLoan={(loanId) => {
              setSelectedLoanId(loanId);
              setLoanEntryContext('audit');
              setActive('loans');
            }}
            onOpenNotificationCategory={(category) => {
              setSelectedNotificationCategory(category);
              setNotificationEntryContext('audit');
              setActive('notifications');
            }}
            onOpenSupportChat={(conversationId) => {
              setSelectedSupportConversationId(conversationId);
              setSupportEntryContext('audit');
              setActive('support');
            }}
            onReturnToContext={
              auditEntryContext
                ? () => {
                    setActive(
                      auditEntryContext === 'dashboard'
                        ? 'dashboard'
                        : auditEntryContext === 'autopayOps'
                          ? 'autopayOps'
                          : 'risk',
                    );
                  }
                : undefined
            }
            returnContextLabel={resolveReturnContextLabel(auditEntryContext, session)}
            session={session}
          />
        ) : null}
        {!schoolSession && active === 'supportAnalytics' ? <SupportAnalyticsPage /> : null}
        </Suspense>
        <FloatingSupportChatLauncher />
      </main>
    </div>
  );
}

export function ShellPreview() {
  return (
    <DashboardShell
      session={{
        sessionType: 'admin',
        userId: 'demo',
        fullName: 'Lulit Mekonnen',
        role: AdminRole.HEAD_OFFICE_DIRECTOR,
        branchName: 'Head Office',
        permissions: ['dashboard.institution', 'analytics.district'],
      }}
    />
  );
}

export function LoginPreview() {
  return null;
}

function ConsolePageFallback() {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-copy">
        <span className="eyebrow">Loading</span>
        <h2>Loading console workspace</h2>
        <p>Preparing the active banking view.</p>
      </div>
    </div>
  );
}

function buildNavSections(items: ConsoleNavItem[]) {
  return [
    {
      label: 'Command center',
      items,
    },
  ] as Array<{ label: string; items: ConsoleNavItem[] }>;
}

function resolveReturnContextLabel(
  context: 'dashboard' | 'risk' | 'autopayOps' | 'audit' | 'notifications' | null,
  session: AppSession,
) {
  if (context === 'dashboard') {
    return `${getSessionScopeLabel(session)} dashboard`;
  }

  if (context === 'autopayOps') {
    return `${getSessionScopeLabel(session)} AutoPay operations`;
  }

  if (context === 'risk') {
    return `${getSessionScopeLabel(session)} risk queue`;
  }

  if (context === 'audit') {
    return `${getSessionScopeLabel(session)} audit queue`;
  }

  if (context === 'notifications') {
    return 'Notification Center';
  }

  return undefined;
}

function getNavIcon(key: ConsoleNavKey) {
  const icons: Record<ConsoleNavKey, string> = {
    dashboard: 'DB',
    schoolConsole: 'SC',
    schoolDashboard: 'DB',
    schoolStudents: 'ST',
    schoolBilling: 'BL',
    schoolPayments: 'PY',
    schoolReports: 'RP',
    schoolCommunication: 'CM',
    schoolSettings: 'SE',
    members: 'MB',
    loans: 'LN',
    autopayOps: 'AP',
    kyc: 'KY',
    notifications: 'NT',
    serviceRequests: 'SR',
    paymentOps: 'PO',
    paymentDisputes: 'PD',
    cardOps: 'CO',
    support: 'SP',
    reports: 'RP',
    branches: 'BR',
    loanEscalations: 'LE',
    kycAudits: 'KA',
    districtAnalytics: 'DA',
    risk: 'RM',
    voting: 'VG',
    audit: 'AL',
    supportAnalytics: 'SA',
    staff: 'ST',
  };

  return icons[key];
}

async function prefetchConsoleSection(section: ConsoleNavKey) {
  if (prefetchedConsoleSections.has(section)) {
    return;
  }

  prefetchedConsoleSections.add(section);

  switch (section) {
    case 'dashboard':
      await Promise.all([
        import('../branch-dashboard/BranchManagerDashboardPage'),
        import('../district-dashboard/DistrictManagerDashboardPage'),
        import('../head-office-dashboard/HeadOfficeManagerDashboardPage'),
      ]);
      return;
    case 'schoolConsole':
      await import('../school-console/SchoolConsolePage');
      return;
    case 'members':
    case 'staff':
    case 'branches':
    case 'loanEscalations':
    case 'kycAudits':
    case 'kyc':
    case 'risk':
    case 'reports':
    case 'supportAnalytics':
      await import('../manager-pages/ManagerPageSections');
      return;
    case 'loans':
      await import('../loan-monitoring/LoanMonitoringPage');
      return;
    case 'autopayOps':
      await import('../notifications/AutopayOperationsPage');
      return;
    case 'notifications':
      await import('../notifications/ManagerNotificationCenterPage');
      return;
    case 'serviceRequests':
      await import('../service-requests/ServiceRequestsPage');
      return;
    case 'paymentOps':
      await import('../payments/PaymentOperationsPage');
      return;
    case 'paymentDisputes':
      await import('../payments/PaymentDisputesPage');
      return;
    case 'cardOps':
      await import('../cards/CardOperationsPage');
      return;
    case 'support':
      await import('../support/SupportInboxPage');
      return;
    case 'districtAnalytics':
      await import('../district-analytics/DistrictAnalyticsPage');
      return;
    case 'voting':
      await import('../voting/VotingManagementPage');
      return;
    case 'audit':
      await import('../audit/AuditLogViewerPage');
      return;
    case 'schoolDashboard':
    case 'schoolStudents':
    case 'schoolBilling':
    case 'schoolPayments':
    case 'schoolReports':
    case 'schoolCommunication':
    case 'schoolSettings':
      await import('../school-console/SchoolSisConsolePage');
      return;
    default:
      return;
  }
}

function resolveConsolePath(session: AppSession, active: ConsoleNavKey) {
  if (isSchoolSession(session)) {
    const schoolRoutes: Partial<Record<ConsoleNavKey, string>> = {
      schoolDashboard: '/school-console',
      schoolStudents: '/school-console/students',
      schoolBilling: '/school-console/billing',
      schoolPayments: '/school-console/payments',
      schoolReports: '/school-console/reports',
      schoolCommunication: '/school-console/communication',
      schoolSettings: '/school-console/settings',
      schoolConsole: '/school-console',
    };
    return schoolRoutes[active] ?? '/school-console';
  }

  if (active === 'schoolConsole') {
    return '/bank-console';
  }

  const basePath = getSessionConsoleBasePath(session);
  const routeSegment = routeSegments[active] ?? active;
  return `${basePath}/${routeSegment}`;
}

function buildConsoleUrl(
  session: AppSession,
  active: ConsoleNavKey,
  auditScope?: AuditScope,
) {
  const sectionPath = resolveConsolePath(session, active);
  const search = active === 'audit' ? applyAuditScopeToSearch('', auditScope) : '';
  return `${sectionPath}${search}`;
}

const routeSegments: Partial<Record<ConsoleNavKey, string>> = {
  dashboard: 'dashboard',
  schoolConsole: 'school-console',
  schoolDashboard: 'dashboard',
  schoolStudents: 'students',
  schoolBilling: 'billing',
  schoolPayments: 'payments',
  schoolReports: 'school-reports',
  schoolCommunication: 'communication',
  schoolSettings: 'settings',
  support: 'support',
  notifications: 'notifications',
  paymentOps: 'payment-operations',
  loans: 'loans',
  districtAnalytics: 'district-analytics',
  risk: 'risk',
  voting: 'voting',
  audit: 'audit',
  reports: 'reports',
  branches: 'branches',
  kyc: 'kyc',
  staff: 'staff',
};
