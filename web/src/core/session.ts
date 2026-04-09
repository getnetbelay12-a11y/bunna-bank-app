export enum AdminRole {
  SUPPORT_AGENT = 'support_agent',
  LOAN_OFFICER = 'loan_officer',
  BRANCH_MANAGER = 'branch_manager',
  DISTRICT_OFFICER = 'district_officer',
  DISTRICT_MANAGER = 'district_manager',
  HEAD_OFFICE_OFFICER = 'head_office_officer',
  HEAD_OFFICE_MANAGER = 'head_office_manager',
  HEAD_OFFICE_DIRECTOR = 'head_office_director',
  ADMIN = 'admin',
}

export type StaffScopeType = 'support' | 'branch' | 'district' | 'head_office';
export type ConsoleLandingKey = 'dashboard' | 'support';

export interface AdminSession {
  sessionType?: 'admin';
  userId: string;
  fullName: string;
  role: AdminRole;
  identifier?: string;
  email?: string;
  branchId?: string;
  districtId?: string;
  branchName?: string;
  districtName?: string;
  permissions?: string[];
}

export interface SchoolSession {
  sessionType: 'school';
  userId: string;
  fullName: string;
  schoolId: string;
  schoolName: string;
  roleLabel: string;
  identifier?: string;
  email?: string;
  branchName?: string;
  permissions?: string[];
}

export type AppSession = AdminSession | SchoolSession;

export type ManagerConsoleKind = StaffScopeType;

const LOCAL_PREVIEW_HOSTS = new Set(['localhost', '127.0.0.1']);
export const DEMO_DIRECTOR_IDENTIFIER = 'admin.head-office@bunnabank.com';
const DEMO_DIRECTOR_NAME = 'Lulit Mekonnen';

export function getManagerConsoleKind(role: AdminRole): ManagerConsoleKind {
  if (role === AdminRole.SUPPORT_AGENT) {
    return 'support';
  }

  if (role === AdminRole.BRANCH_MANAGER) {
    return 'branch';
  }

  if (role === AdminRole.DISTRICT_MANAGER || role === AdminRole.DISTRICT_OFFICER) {
    return 'district';
  }

  return 'head_office';
}

export function isSchoolSession(session: AppSession): session is SchoolSession {
  return session.sessionType === 'school';
}

export function getSessionConsoleBasePath(session: AppSession): string {
  if (isSchoolSession(session)) {
    return '/console/school';
  }

  return getConsoleBasePath(session.role);
}

export function getDefaultSessionSection(
  session: AppSession,
): ConsoleLandingKey | 'schoolConsole' | 'schoolDashboard' {
  if (isSchoolSession(session)) {
    return 'schoolDashboard';
  }

  return getDefaultConsoleSection(session.role);
}

export function getRoleLabel(role: AdminRole): string {
  if (role === AdminRole.HEAD_OFFICE_DIRECTOR) {
    return 'Head Office Director';
  }

  return role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export function getScopeLabel(session: AdminSession): string {
  const consoleKind = getManagerConsoleKind(session.role);

  if (consoleKind === 'support') {
    return 'Support operations';
  }

  if (consoleKind === 'branch') {
    return `Branch: ${session.branchName ?? 'Assigned branch'}`;
  }

  if (consoleKind === 'district') {
    return `District: ${session.districtName ?? 'Assigned district'}`;
  }

  return 'Institution-wide view';
}

export function getSessionRoleLabel(session: AppSession): string {
  if (isSchoolSession(session)) {
    return session.roleLabel;
  }

  return getRoleLabel(session.role);
}

export function getSessionScopeLabel(session: AppSession): string {
  if (isSchoolSession(session)) {
    return `School: ${session.schoolName}`;
  }

  return getScopeLabel(session);
}

export function canManageVoting(role: AdminRole): boolean {
  return [
    AdminRole.HEAD_OFFICE_MANAGER,
    AdminRole.HEAD_OFFICE_DIRECTOR,
    AdminRole.ADMIN,
  ].includes(role);
}

export function canAccessSupport(role: AdminRole): boolean {
  return [
    AdminRole.SUPPORT_AGENT,
    AdminRole.ADMIN,
    AdminRole.HEAD_OFFICE_DIRECTOR,
    AdminRole.HEAD_OFFICE_OFFICER,
    AdminRole.HEAD_OFFICE_MANAGER,
    AdminRole.DISTRICT_OFFICER,
    AdminRole.DISTRICT_MANAGER,
    AdminRole.BRANCH_MANAGER,
  ].includes(role);
}

export function canViewAudit(role: AdminRole): boolean {
  return (
    role === AdminRole.ADMIN ||
    role === AdminRole.HEAD_OFFICE_MANAGER ||
    role === AdminRole.HEAD_OFFICE_DIRECTOR
  );
}

export function canViewParticipationSummary(role: AdminRole): boolean {
  return [
    AdminRole.BRANCH_MANAGER,
    AdminRole.DISTRICT_MANAGER,
    AdminRole.HEAD_OFFICE_DIRECTOR,
    AdminRole.HEAD_OFFICE_MANAGER,
    AdminRole.ADMIN,
  ].includes(role);
}

export function getDefaultConsoleSection(role: AdminRole): ConsoleLandingKey {
  return getManagerConsoleKind(role) === 'support' ? 'support' : 'dashboard';
}

export function getConsoleBasePath(role: AdminRole): string {
  switch (getManagerConsoleKind(role)) {
    case 'branch':
      return '/console/branch';
    case 'district':
      return '/console/district';
    case 'support':
      return '/console/support';
    default:
      return '/console/head-office';
  }
}

export function applyLocalDemoDirectorRole(
  session: AdminSession,
  identifier?: string,
): AdminSession {
  const normalizedIdentifier = identifier?.trim().toLowerCase();
  if (normalizedIdentifier !== DEMO_DIRECTOR_IDENTIFIER) {
    return session;
  }

  const isEligibleRole =
    session.role === AdminRole.ADMIN ||
    session.role === AdminRole.HEAD_OFFICE_MANAGER ||
    session.role === AdminRole.HEAD_OFFICE_DIRECTOR;
  if (!isEligibleRole || !isLocalPreviewRuntime()) {
    return session;
  }

  return {
    ...session,
    fullName: DEMO_DIRECTOR_NAME,
    role: AdminRole.HEAD_OFFICE_DIRECTOR,
    branchName: 'Head Office',
    districtName: undefined,
    permissions:
      session.permissions != null && session.permissions.length > 0
        ? session.permissions
        : ['dashboard.institution', 'analytics.district', 'risk.monitor'],
  };
}

function isLocalPreviewRuntime(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return LOCAL_PREVIEW_HOSTS.has(window.location.hostname);
}
