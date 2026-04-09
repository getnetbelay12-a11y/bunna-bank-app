import {
  AdminRole,
  canManageVoting,
  canViewAudit,
  canViewParticipationSummary,
  getManagerConsoleKind,
  isSchoolSession,
  type AppSession,
} from '../../core/session';

export type ConsoleNavKey =
  | 'dashboard'
  | 'schoolConsole'
  | 'schoolDashboard'
  | 'schoolStudents'
  | 'schoolBilling'
  | 'schoolPayments'
  | 'schoolReports'
  | 'schoolCommunication'
  | 'schoolSettings'
  | 'members'
  | 'loans'
  | 'autopayOps'
  | 'kyc'
  | 'notifications'
  | 'serviceRequests'
  | 'paymentOps'
  | 'paymentDisputes'
  | 'cardOps'
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
  title: 'Branch Command Center',
  subtitle: 'Branch-level employee performance, loan work queues, KYC review, and live customer support.',
  summaryLabel: 'Branch operations',
  navItems: [
    { key: 'dashboard', label: 'Dashboard', description: 'Branch KPIs, queues, and daily alerts.' },
    {
      key: 'schoolConsole',
      label: 'Schools',
      description: 'Schools in this branch with registry, billing, collections, and onboarding.',
    },
    {
      key: 'staff',
      label: 'Employee Performance',
      description: 'Top employees, watchlist signals, and branch productivity.',
    },
    {
      key: 'loans',
      label: 'Loans',
      description: 'Pending branch review, document correction, and forwarding queue.',
    },
    {
      key: 'kyc',
      label: 'KYC Queue',
      description: 'Identity review, follow-up, and approval readiness.',
    },
    {
      key: 'support',
      label: 'Support',
      description: 'Live chat and member support cases within this branch.',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Customer communications in branch scope.',
    },
    { key: 'reports', label: 'Reports', description: 'Branch operational reporting.' },
  ],
};

const districtDefinition: ConsoleDefinition = {
  title: 'District Command Center',
  subtitle: 'District oversight across branch performance, loan approvals, KYC completion, and support workload.',
  summaryLabel: 'District operations',
  navItems: [
    { key: 'dashboard', label: 'Dashboard', description: 'District KPIs, branch ranking, and escalations.' },
    {
      key: 'schoolConsole',
      label: 'Schools',
      description: 'Schools in this district with registry, billing, collections, and onboarding.',
    },
    {
      key: 'branches',
      label: 'Branch Performance',
      description: 'Branch comparison and operational health.',
    },
    {
      key: 'loans',
      label: 'Loans',
      description: 'District review queue and escalated loan decisions.',
    },
    {
      key: 'support',
      label: 'Support',
      description: 'Live chat and support issues within the assigned district.',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'District reminder and customer communication workflows.',
    },
    { key: 'reports', label: 'Reports', description: 'District-level reports.' },
  ],
};

const headOfficeDefinition: ConsoleDefinition = {
  title: 'Head Office Command Center',
  subtitle: 'Institution-wide visibility across customers, districts, risk, support, governance, and approvals.',
  summaryLabel: 'Institution-wide operations',
  navItems: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      description: 'Executive overview of customers, loans, savings, risk, and governance.',
    },
    {
      key: 'schoolConsole',
      label: 'Schools',
      description: 'School onboarding, student-account linking, payment operations, notifications, and reconciliation.',
    },
    {
      key: 'loans',
      label: 'Loans',
      description: 'Head office approvals and high-value queue.',
    },
    {
      key: 'support',
      label: 'Support',
      description: 'Institution-wide support load, live chat, and escalation patterns.',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Broadcast and event notifications.',
    },
    {
      key: 'reports',
      label: 'Reports',
      description: 'Executive reporting and operational exports.',
    },
    {
      key: 'voting',
      label: 'Governance',
      description: 'Governance visibility, active votes, and announcements.',
    },
  ],
};

const supportDefinition: ConsoleDefinition = {
  title: 'Support Console',
  subtitle: 'Assigned live chats, support queues, and customer follow-up.',
  summaryLabel: 'Support operations',
  navItems: [
    {
      key: 'serviceRequests',
      label: 'Service Requests',
      description: 'Customer-submitted service workflows and issue tracking.',
    },
    {
      key: 'paymentOps',
      label: 'Payment Operations',
      description: 'Receipt history and QR payment review for support staff.',
    },
    {
      key: 'paymentDisputes',
      label: 'Payment Disputes',
      description: 'Payment failure and dispute handling for support staff.',
    },
    {
      key: 'cardOps',
      label: 'Card Operations',
      description: 'ATM and replacement card request handling for support staff.',
    },
    {
      key: 'support',
      label: 'Customer Support',
      description: 'Assigned conversations, replies, and status changes.',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Customer reminder and support follow-up messages.',
    },
  ],
};

export function getConsoleDefinition(session: AppSession): ConsoleDefinition {
  if (isSchoolSession(session)) {
    return {
      title: 'School SIS',
      subtitle: 'Student registry, parent linking, billing status, reports, and communication for one school.',
      summaryLabel: 'School information system',
      navItems: [
        {
          key: 'schoolDashboard',
          label: 'Dashboard',
          description: 'Students, invoices, overdue posture, and daily action items.',
        },
        {
          key: 'schoolStudents',
          label: 'Students',
          description: 'Student registry, parent links, search, and filters.',
        },
        {
          key: 'schoolBilling',
          label: 'Billing',
          description: 'Monthly fee setup, invoice creation, due dates, and penalties.',
        },
        {
          key: 'schoolPayments',
          label: 'Payments',
          description: 'Collection totals, daily payment summary, and transaction history.',
        },
        {
          key: 'schoolReports',
          label: 'Reports',
          description: 'Collection reports, overdue summaries, and billing trends.',
        },
        {
          key: 'schoolCommunication',
          label: 'Communication',
          description: 'Reminder queues and school announcements for parents.',
        },
        {
          key: 'schoolSettings',
          label: 'Settings',
          description: 'School profile, branch context, and billing policy defaults.',
        },
      ],
    };
  }

  const consoleKind = getManagerConsoleKind(session.role);

  if (consoleKind === 'support') {
    return supportDefinition;
  }

  if (consoleKind === 'branch') {
    return withParticipation(branchDefinition, session.role);
  }

  if (consoleKind === 'district') {
    return withParticipation(districtDefinition, session.role);
  }

  return {
    ...headOfficeDefinition,
    title:
      session.role === AdminRole.HEAD_OFFICE_DIRECTOR
        ? 'Head Office Command Center'
        : headOfficeDefinition.title,
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
