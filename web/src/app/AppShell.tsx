import { useEffect, useState } from 'react';

import { createAppClient } from '../core/api/appClient';
import {
  AdminRole,
  getDefaultConsoleSection,
  getDefaultSessionSection,
  isSchoolSession,
  type AppSession,
} from '../core/session';
import { LoginPage } from '../features/login/LoginPage';
import { DashboardShell } from '../features/layout/DashboardShell';
import { ParentPortalPage } from '../features/parent-portal/ParentPortalPage';
import type { ConsoleNavKey } from '../features/shared-layout/consoleConfig';
import { AppClientContext } from './AppContext';

const appClient = createAppClient();
const previewSession = resolvePreviewSession();
const previewSection = resolvePreviewSection();
const previewBootstrap = resolvePreviewBootstrap();

export function AppShell() {
  const parentPortalRoute = isParentPortalRoute();
  const [session, setSession] = useState<AppSession | null>(
    previewBootstrap ? null : previewSession,
  );
  const [bootstrappingPreview, setBootstrappingPreview] = useState(
    Boolean(previewBootstrap),
  );

  useEffect(() => {
    if (!previewBootstrap) {
      return;
    }

    let cancelled = false;

    void appClient.authApi
      .login({
        identifier: previewBootstrap.identifier,
        password: 'demo-pass',
      })
      .then((nextSession) => {
        if (cancelled) {
          return;
        }

        setSession(nextSession);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }

        setBootstrappingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (bootstrappingPreview) {
    return (
      <AppClientContext.Provider value={appClient}>
        <div className="standalone-page">
          <p className="muted">Connecting to the local backend...</p>
        </div>
      </AppClientContext.Provider>
    );
  }

  return (
    <AppClientContext.Provider value={appClient}>
      {parentPortalRoute ? (
        <ParentPortalPage />
      ) : session ? (
        <DashboardShell
          session={session}
          initialActive={previewSection ?? resolvePathSection(session)}
          onLogout={() => {
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', '/');
            }
            setSession(null);
          }}
        />
      ) : (
        <LoginPage onLogin={setSession} />
      )}
    </AppClientContext.Provider>
  );
}

function isParentPortalRoute() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.pathname.toLowerCase() === '/portal/parent';
}

function resolvePreviewSession(): AppSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const preview = new URLSearchParams(window.location.search).get('preview');

  if (preview === 'admin') {
    return {
      sessionType: 'admin',
      userId: 'preview_admin',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.HEAD_OFFICE_DIRECTOR,
      branchName: 'Head Office',
      permissions: ['dashboard.institution', 'analytics.district'],
    };
  }

  if (preview === 'support') {
    return {
      sessionType: 'admin',
      userId: 'preview_support',
      fullName: 'Rahel Desta',
      role: AdminRole.SUPPORT_AGENT,
      branchName: 'Bahir Dar Branch',
      districtName: 'Bahir Dar District',
      permissions: ['support.assigned'],
    };
  }

  return null;
}

function resolvePreviewSection(): ConsoleNavKey | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const section = new URLSearchParams(window.location.search).get('section');
  if (!section) {
    return undefined;
  }

  return section as ConsoleNavKey;
}

function resolvePreviewBootstrap() {
  if (typeof window === 'undefined') {
    return null;
  }

  const preview = new URLSearchParams(window.location.search).get('preview');

  if (preview === 'admin') {
    return { identifier: 'admin.head-office@bunnabank.com' };
  }

  if (preview === 'support') {
    return { identifier: 'agent.support@bunnabank.com' };
  }

  return null;
}

function resolvePathSection(session: AppSession): ConsoleNavKey {
  if (typeof window === 'undefined') {
    return getDefaultSessionSection(session) as ConsoleNavKey;
  }

  const pathname = window.location.pathname.toLowerCase();
  const segments = pathname.split('/').filter(Boolean);
  const tail = segments[segments.length - 1];
  if (tail) {
    return normalizeConsoleSection(tail, session);
  }

  return getDefaultSessionSection(session) as ConsoleNavKey;
}

function normalizeConsoleSection(section: string, session: AppSession): ConsoleNavKey {
  if (isSchoolSession(session)) {
    const schoolAliases: Record<string, ConsoleNavKey> = {
      'school-console': 'schoolDashboard',
      dashboard: 'schoolDashboard',
      students: 'schoolStudents',
      billing: 'schoolBilling',
      payments: 'schoolPayments',
      reports: 'schoolReports',
      communication: 'schoolCommunication',
      settings: 'schoolSettings',
    };

    return schoolAliases[section] ?? (getDefaultSessionSection(session) as ConsoleNavKey);
  }

  const aliases: Record<string, ConsoleNavKey> = {
    dashboard: 'dashboard',
    'school-console': 'schoolConsole',
    'bank-console': 'schoolConsole',
    support: 'support',
    notifications: 'notifications',
    loans: 'loans',
    risk: 'risk',
    audit: 'audit',
    voting: 'voting',
    reports: 'reports',
    kyc: 'kyc',
    branches: 'branches',
    staff: 'staff',
    'district-analytics': 'districtAnalytics',
  };

  return aliases[section] ?? (getDefaultSessionSection(session) as ConsoleNavKey);
}
