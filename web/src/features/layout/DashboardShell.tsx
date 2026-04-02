import { useEffect, useRef, useState } from 'react';

import {
  AdminRole,
  canManageVoting,
  canViewAudit,
  getManagerConsoleKind,
  getRoleLabel,
  getScopeLabel,
  type AdminSession,
} from '../../core/session';
import { AuditLogViewerPage } from '../audit/AuditLogViewerPage';
import { BranchAnalyticsPage } from '../branch-analytics/BranchAnalyticsPage';
import { DistrictAnalyticsPage } from '../district-analytics/DistrictAnalyticsPage';
import { BranchManagerDashboardPage } from '../branch-dashboard/BranchManagerDashboardPage';
import { DistrictManagerDashboardPage } from '../district-dashboard/DistrictManagerDashboardPage';
import { HeadOfficeManagerDashboardPage } from '../head-office-dashboard/HeadOfficeManagerDashboardPage';
import { LoanMonitoringPage } from '../loan-monitoring/LoanMonitoringPage';
import { ManagerNotificationCenterPage } from '../notifications/ManagerNotificationCenterPage';
import { FloatingSupportChatLauncher } from '../support/FloatingSupportChatLauncher';
import { SupportInboxPage } from '../support/SupportInboxPage';
import {
  AlertsPage,
  BranchOverviewPage,
  KycAuditPage,
  KycVerificationPage,
  MembersPage,
  RiskMonitoringPage,
  ReportsHubPage,
  StaffSnapshotPage,
  SupportAnalyticsPage,
} from '../manager-pages/ManagerPageSections';
import {
  getConsoleDefinition,
  type ConsoleNavKey,
  type ConsoleNavItem,
} from '../shared-layout/consoleConfig';
import { VotingManagementPage } from '../voting/VotingManagementPage';

type DashboardShellProps = {
  session: AdminSession;
  onLogout?: () => void;
};

export function DashboardShell({ session, onLogout }: DashboardShellProps) {
  const consoleDefinition = getConsoleDefinition(session);
  const [active, setActive] = useState<ConsoleNavKey>('dashboard');
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const activeItem =
    consoleDefinition.navItems.find((item) => item.key === active) ??
    consoleDefinition.navItems[0];
  const consoleKind = getManagerConsoleKind(session.role);
  const navSections = buildNavSections(consoleDefinition.navItems);
  const navMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!navMenuRef.current?.contains(event.target as Node)) {
        setIsNavMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsNavMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-header">
            <div className="brand-mark" aria-hidden="true">
              <img src="/bunna-bank-logo.png" alt="Bunna Bank logo" className="brand-logo" />
            </div>
            <div className="brand-copy">
              <p className="eyebrow">Bunna Bank</p>
              <h1>{consoleDefinition.title}</h1>
            </div>
          </div>
          <p className="brand-subtitle muted">{consoleDefinition.subtitle}</p>
        </div>

        <div className="sidebar-menu-shell" ref={navMenuRef}>
          <div className="sidebar-menu-header">
            <p className="sidebar-label">Navigation</p>
            <button
              type="button"
              className="sidebar-menu-trigger"
              aria-haspopup="menu"
              aria-expanded={isNavMenuOpen}
              aria-label="Open navigation menu"
              onClick={() => setIsNavMenuOpen((value) => !value)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          {isNavMenuOpen ? (
            <nav className="sidebar-nav-popover" aria-label="Manager navigation">
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
                          onClick={() => {
                            setActive(item.key);
                            setIsNavMenuOpen(false);
                          }}
                          type="button"
                          role="menuitem"
                        >
                          <span className="nav-item-icon" aria-hidden="true">
                            {getNavIcon(item.key)}
                          </span>
                          <span className="nav-item-copy">
                            <span className="nav-item-label">{item.label}</span>
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
              {onLogout ? (
                <div className="nav-group">
                  <p className="sidebar-label">Account</p>
                  <button
                    className="nav-item nav-item-logout"
                    onClick={() => {
                      setIsNavMenuOpen(false);
                      onLogout();
                    }}
                    type="button"
                    role="menuitem"
                  >
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
                </div>
              ) : null}
            </nav>
          ) : null}
        </div>

        <div className="sidebar-footer">
          <p className="muted">Use the menu to switch console sections.</p>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{consoleDefinition.summaryLabel}</p>
            <h2>{activeItem.label}</h2>
            <p className="muted">{activeItem.description}</p>
          </div>
          <div className="topbar-user-block">
            <span className="eyebrow">Signed In</span>
            <strong>{session.fullName}</strong>
            <span className="muted">{getRoleLabel(session.role)}</span>
            <span className="muted">{getScopeLabel(session)}</span>
          </div>
        </header>

        {active === 'dashboard' && consoleKind === 'branch' ? (
          <BranchManagerDashboardPage session={session} />
        ) : null}
        {active === 'dashboard' && consoleKind === 'district' ? (
          <DistrictManagerDashboardPage session={session} />
        ) : null}
        {active === 'dashboard' && consoleKind === 'head_office' ? (
          <HeadOfficeManagerDashboardPage session={session} />
        ) : null}
        {active === 'members' ? <MembersPage session={session} /> : null}
        {active === 'loans' ? <LoanMonitoringPage /> : null}
        {active === 'kyc' ? <KycVerificationPage session={session} /> : null}
        {active === 'staff' ? <StaffSnapshotPage session={session} /> : null}
        {active === 'branches' ? <BranchOverviewPage session={session} /> : null}
        {active === 'loanEscalations' ? <AlertsPage session={session} /> : null}
        {active === 'kycAudits' ? <KycAuditPage session={session} /> : null}
        {active === 'districtAnalytics' ? <DistrictAnalyticsPage session={session} /> : null}
        {active === 'risk' ? <RiskMonitoringPage session={session} /> : null}
        {active === 'notifications' ? (
          <ManagerNotificationCenterPage session={session} />
        ) : null}
        {active === 'support' ? <SupportInboxPage /> : null}
        {active === 'reports' ? <ReportsHubPage session={session} /> : null}
        {active === 'supportAnalytics' ? <SupportAnalyticsPage /> : null}
        {active === 'voting' && canManageVoting(session.role) ? (
          <VotingManagementPage session={session} />
        ) : null}
        {active === 'audit' && canViewAudit(session.role) ? (
          <AuditLogViewerPage session={session} />
        ) : null}
        {active === 'supportAnalytics' ? <SupportAnalyticsPage /> : null}
        <FloatingSupportChatLauncher />
      </main>
    </div>
  );
}

export function ShellPreview() {
  return (
    <DashboardShell
      session={{
        userId: 'demo',
        fullName: 'Demo User',
        role: AdminRole.HEAD_OFFICE_MANAGER,
        branchName: 'Head Office',
      }}
    />
  );
}

export function LoginPreview() {
  return null;
}

function buildNavSections(items: ConsoleNavItem[]) {
  const mainKeys: ConsoleNavKey[] = ['dashboard', 'loans', 'districtAnalytics', 'risk'];
  const operationsKeys: ConsoleNavKey[] = [
    'members',
    'branches',
    'loanEscalations',
    'kyc',
    'kycAudits',
    'staff',
    'voting',
    'support',
    'supportAnalytics',
    'notifications',
    'reports',
    'audit',
  ];

  const byKey = new Map(items.map((item) => [item.key, item]));

  return [
    {
      label: 'Main',
      items: mainKeys.map((key) => byKey.get(key)).filter(Boolean),
    },
    {
      label: 'Operations',
      items: operationsKeys.map((key) => byKey.get(key)).filter(Boolean),
    },
  ] as Array<{ label: string; items: ConsoleNavItem[] }>;
}

function getNavIcon(key: ConsoleNavKey) {
  const icons: Record<ConsoleNavKey, string> = {
    dashboard: 'DB',
    members: 'MB',
    loans: 'LN',
    kyc: 'KY',
    notifications: 'NT',
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
