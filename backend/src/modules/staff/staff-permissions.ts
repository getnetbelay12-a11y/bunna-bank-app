import { UserRole } from '../../common/enums';

export function deriveStaffPermissions(role: UserRole): string[] {
  switch (role) {
    case UserRole.SCHOOL_ADMIN:
      return [
        'school.console',
        'school.registry',
        'school.billing',
        'school.collections',
        'school.onboarding',
      ];
    case UserRole.ADMIN:
      return [
        'dashboard.institution',
        'analytics.district',
        'loans.high_value',
        'risk.monitor',
        'governance.manage',
        'support.institution',
        'notifications.manage',
        'audit.read',
      ];
    case UserRole.HEAD_OFFICE_MANAGER:
    case UserRole.HEAD_OFFICE_OFFICER:
      return [
        'dashboard.institution',
        'analytics.district',
        'loans.high_value',
        'risk.monitor',
        'support.institution',
        'notifications.manage',
        'audit.read',
      ];
    case UserRole.DISTRICT_MANAGER:
    case UserRole.DISTRICT_OFFICER:
      return [
        'dashboard.district',
        'analytics.branch',
        'loans.district',
        'support.district',
        'notifications.manage',
        'reports.read',
      ];
    case UserRole.BRANCH_MANAGER:
      return [
        'dashboard.branch',
        'employees.branch',
        'loans.branch',
        'kyc.branch',
        'support.branch',
        'notifications.manage',
        'reports.read',
      ];
    case UserRole.SUPPORT_AGENT:
      return ['support.assigned'];
    case UserRole.LOAN_OFFICER:
      return ['loans.branch'];
    default:
      return [];
  }
}
