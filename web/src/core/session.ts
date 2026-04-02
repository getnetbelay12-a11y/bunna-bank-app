export enum AdminRole {
  SUPPORT_AGENT = 'support_agent',
  LOAN_OFFICER = 'loan_officer',
  BRANCH_MANAGER = 'branch_manager',
  DISTRICT_OFFICER = 'district_officer',
  DISTRICT_MANAGER = 'district_manager',
  HEAD_OFFICE_OFFICER = 'head_office_officer',
  HEAD_OFFICE_MANAGER = 'head_office_manager',
  ADMIN = 'admin',
}

export interface AdminSession {
  userId: string;
  fullName: string;
  role: AdminRole;
  branchName: string;
}

export type ManagerConsoleKind = 'branch' | 'district' | 'head_office';

export function isHeadOfficeConsoleRole(role: AdminRole): boolean {
  return [
    AdminRole.ADMIN,
    AdminRole.HEAD_OFFICE_MANAGER,
    AdminRole.HEAD_OFFICE_OFFICER,
  ].includes(role);
}

export function getManagerConsoleKind(role: AdminRole): ManagerConsoleKind {
  if (role === AdminRole.BRANCH_MANAGER) {
    return 'branch';
  }

  if (role === AdminRole.DISTRICT_MANAGER || role === AdminRole.DISTRICT_OFFICER) {
    return 'district';
  }

  return 'head_office';
}

export function getRoleLabel(role: AdminRole): string {
  return role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export function getScopeLabel(session: AdminSession): string {
  const consoleKind = getManagerConsoleKind(session.role);

  if (consoleKind === 'branch') {
    return `Branch: ${session.branchName}`;
  }

  if (consoleKind === 'district') {
    return `District: ${session.branchName}`;
  }

  return 'Institution-wide view';
}

export function canManageVoting(role: AdminRole): boolean {
  return [AdminRole.HEAD_OFFICE_MANAGER, AdminRole.ADMIN].includes(role);
}

export function canAccessSupport(role: AdminRole): boolean {
  return [
    AdminRole.SUPPORT_AGENT,
    AdminRole.ADMIN,
    AdminRole.HEAD_OFFICE_OFFICER,
    AdminRole.HEAD_OFFICE_MANAGER,
    AdminRole.BRANCH_MANAGER,
  ].includes(role);
}

export function canViewAudit(role: AdminRole): boolean {
  return role === AdminRole.ADMIN || role === AdminRole.HEAD_OFFICE_MANAGER;
}

export function canViewParticipationSummary(role: AdminRole): boolean {
  return [
    AdminRole.BRANCH_MANAGER,
    AdminRole.DISTRICT_MANAGER,
    AdminRole.HEAD_OFFICE_MANAGER,
    AdminRole.ADMIN,
  ].includes(role);
}
