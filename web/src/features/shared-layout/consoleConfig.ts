import {
  AdminRole,
  canManageVoting,
  canViewAudit,
  canViewParticipationSummary,
  getManagerConsoleKind,
  type AdminSession,
} from '../../core/session';

export type ConsoleNavKey =
  | 'dashboard'
  | 'members'
  | 'loans'
  | 'kyc'
  | 'notifications'
  | 'support'
  | 'reports'
  | 'branches'
  | 'loanEscalations'
  | 'kycAudits'
  | 'districtAnalytics'
  | 'risk'
  | 'voting'
  | 'audit'
  | 'supportAnalytics'
  | 'staff';

export type ConsoleNavItem = {
  key: ConsoleNavKey;
  label: string;
  description: string;
};

export type ConsoleDefinition = {
  title: string;
  subtitle: string;
  summaryLabel: string;
  navItems: ConsoleNavItem[];
};

const branchDefinition: ConsoleDefinition = {
  title: 'Branch Manager Console',
  subtitle: 'Branch-level operations, approvals, and customer service monitoring.',
  summaryLabel: 'Branch operations',
  navItems: [
    { key: 'dashboard', label: 'Dashboard', description: 'Branch KPIs and activity.' },
    { key: 'members', label: 'Members', description: 'Branch member activity and profile coverage.' },
    {
      key: 'loans',
      label: 'Loan Applications',
      description: 'Pending branch review, documents, and forwarding queue.',
    },
    {
      key: 'kyc',
      label: 'KYC Verification',
      description: 'Identity review, follow-up, and approval readiness.',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Customer communications in branch scope.',
    },
    {
      key: 'support',
      label: 'Customer Support',
      description: 'Live chat, tickets, and callback issues in branch scope.',
    },
    { key: 'reports', label: 'Reports', description: 'Branch operational reporting.' },
  ],
};

const districtDefinition: ConsoleDefinition = {
  title: 'District Manager Console',
  subtitle: 'District oversight across branches, escalations, and performance.',
  summaryLabel: 'District operations',
  navItems: [
    {
      key: 'dashboard',
      label: 'District Performance',
      description: 'District KPIs and escalations.',
    },
    {
      key: 'branches',
      label: 'Branch Overview',
      description: 'Branch comparison and operational health.',
    },
    {
      key: 'loanEscalations',
      label: 'Loan Escalations',
      description: 'District review queue and escalated loan decisions.',
    },
    {
      key: 'kycAudits',
      label: 'KYC Audits',
      description: 'District verification exceptions and audit follow-up.',
    },
    { key: 'reports', label: 'Reports', description: 'District-level reports.' },
  ],
};

const headOfficeDefinition: ConsoleDefinition = {
  title: 'Head Office Manager Console',
  subtitle: '',
  summaryLabel: 'Institution-wide operations',
  navItems: [
    {
      key: 'dashboard',
      label: 'Institution Dashboard',
      description: 'Executive overview of service, members, and approvals.',
    },
    {
      key: 'loans',
      label: 'High Value Loan Approvals',
      description: 'Head office approvals and high-value queue.',
    },
    {
      key: 'districtAnalytics',
      label: 'District Analytics',
      description: 'District comparison and intervention signals.',
    },
    {
      key: 'risk',
      label: 'Risk Monitoring',
      description: 'Institution-wide risk, pending documents, and escalations.',
    },
    {
      key: 'voting',
      label: 'Voting & Governance',
      description: 'Secondary governance control for active voting events.',
    },
    {
      key: 'supportAnalytics',
      label: 'Customer Support',
      description: 'Support load, live chat, and escalation patterns.',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Broadcast and event notifications.',
    },
    {
      key: 'audit',
      label: 'Audit & Reports',
      description: 'Audit visibility and reporting.',
    },
  ],
};

export function getConsoleDefinition(session: AdminSession): ConsoleDefinition {
  const consoleKind = getManagerConsoleKind(session.role);

  if (consoleKind === 'branch') {
    return withParticipation(branchDefinition, session.role);
  }

  if (consoleKind === 'district') {
    return withParticipation(districtDefinition, session.role);
  }

  return {
    ...headOfficeDefinition,
    navItems: headOfficeDefinition.navItems.filter((item) => {
      if (item.key === 'voting') {
        return canManageVoting(session.role);
      }

      if (item.key === 'audit') {
        return canViewAudit(session.role);
      }

      return true;
    }),
  };
}

function withParticipation(
  definition: ConsoleDefinition,
  role: AdminRole,
): ConsoleDefinition {
  if (!canViewParticipationSummary(role)) {
    return definition;
  }

  return {
    ...definition,
    navItems: [...definition.navItems],
  };
}
