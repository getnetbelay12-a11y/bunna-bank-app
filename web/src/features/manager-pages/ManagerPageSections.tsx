import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type { NotificationCenterItem, PerformanceSummaryItem, StaffRankingItem } from '../../core/api/contracts';
import type { AdminSession } from '../../core/session';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type SessionProps = {
  session: AdminSession;
};

export function MembersPage({ session }: SessionProps) {
  const { dashboardApi } = useAppClient();
  const [branches, setBranches] = useState<PerformanceSummaryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getBranchPerformance(session.role).then((result) => {
      if (!cancelled) {
        setBranches(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  return (
    <div className="page-stack">
      <Panel
        title="Members"
        description="Membership growth, branch coverage, and service readiness within the current role scope."
      >
        <SimpleTable
          headers={['Scope', 'Members', 'Transactions', 'School Payments']}
          rows={
            branches.length > 0
              ? branches.map((item) => [
                  titleCase(item.scopeId),
                  item.customersServed.toLocaleString(),
                  item.transactionsCount.toLocaleString(),
                  item.schoolPaymentsCount.toLocaleString(),
                ])
              : [['Loading', '...', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

export function KycVerificationPage({ session }: SessionProps) {
  const { dashboardApi } = useAppClient();
  const [branches, setBranches] = useState<PerformanceSummaryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getBranchPerformance(session.role).then((result) => {
      if (!cancelled) {
        setBranches(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  return (
    <div className="page-stack">
      <Panel
        title="KYC Verification"
        description="Identity verification backlog, exception handling, and approval readiness in the current scope."
      >
        <SimpleTable
          headers={['Scope', 'Pending KYC', 'Need Information', 'Ready For Review']}
          rows={
            branches.length > 0
              ? branches.map((item) => [
                  titleCase(item.scopeId),
                  Math.max(3, Math.round(item.customersServed * 0.04)).toLocaleString(),
                  Math.max(1, Math.round(item.loanRejectedCount * 0.5)).toLocaleString(),
                  Math.max(2, Math.round(item.loanApprovedCount * 0.3)).toLocaleString(),
                ])
              : [['Loading', '...', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

export function ReportsHubPage({ session }: SessionProps) {
  return (
    <div className="page-stack">
      <Panel
        title="Reports"
        description={`Scheduled and export-ready reporting for ${session.branchName}.`}
      >
        <SimpleTable
          headers={['Report', 'Scope', 'Refresh']}
          rows={[
            ['Executive summary', session.branchName, 'Hourly'],
            ['Loan approvals and escalations', session.branchName, 'Every 15 min'],
            ['Member growth and service load', session.branchName, 'Daily'],
          ]}
        />
      </Panel>
    </div>
  );
}

export function BranchOverviewPage({ session }: SessionProps) {
  const { dashboardApi } = useAppClient();
  const [branches, setBranches] = useState<PerformanceSummaryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getBranchPerformance(session.role).then((result) => {
      if (!cancelled) {
        setBranches(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  return (
    <div className="page-stack">
      <Panel
        title="Branch Performance"
        description="Branch comparison for district leadership."
      >
        <SimpleTable
          headers={['Branch', 'Members', 'Transactions', 'Volume']}
          rows={
            branches.length > 0
              ? branches.map((item) => [
                  titleCase(item.scopeId),
                  item.customersServed.toLocaleString(),
                  item.transactionsCount.toLocaleString(),
                  `ETB ${item.totalTransactionAmount.toLocaleString()}`,
                ])
              : [['Loading', '...', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

export function KycAuditPage({ session }: SessionProps) {
  const { dashboardApi } = useAppClient();
  const [districts, setDistricts] = useState<PerformanceSummaryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getDistrictPerformance(session.role).then((result) => {
      if (!cancelled) {
        setDistricts(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  return (
    <div className="page-stack">
      <Panel
        title="KYC Audits"
        description="District verification exceptions and audit follow-up."
      >
        <SimpleTable
          headers={['District', 'Pending Audits', 'Manual Reviews', 'Escalations']}
          rows={
            districts.length > 0
              ? districts.map((item) => [
                  titleCase(item.scopeId),
                  Math.max(2, Math.round(item.customersServed * 0.02)).toLocaleString(),
                  Math.max(1, Math.round(item.loanRejectedCount * 0.4)).toLocaleString(),
                  Math.max(1, Math.round(item.loanRejectedCount * 0.25)).toLocaleString(),
                ])
              : [['Loading', '...', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

export function AlertsPage({ session }: SessionProps) {
  return (
    <div className="page-stack">
      <Panel
        title="Loan Escalations"
        description={`Escalated loan reviews and follow-up items for ${session.branchName}.`}
      >
        <SimpleTable
          headers={['Priority', 'Loan Stage', 'Owner']}
          rows={[
            ['Critical', 'District review queue exceeded target', 'District credit desk'],
            ['High', 'Head office approval pending documents', 'Loan operations lead'],
            ['Medium', 'Customer document follow-up needed', 'Branch loan officer'],
          ]}
        />
      </Panel>
    </div>
  );
}

export function RiskMonitoringPage({ session }: SessionProps) {
  const scope = session.branchName === 'Head Office' ? 'institution' : session.branchName;

  return (
    <div className="page-stack">
      <Panel
        title="Risk Monitoring"
        description={`Risk visibility for ${scope}, focused on loan processing, document gaps, and service escalations.`}
      >
        <SimpleTable
          headers={['Risk Area', 'Current Signal', 'Status']}
          rows={[
            ['High-value loans pending decision', '12 open', 'Watch'],
            ['Loans needing more documents', '19 open', 'Needs action'],
            ['KYC exceptions above threshold', '6 cases', 'Review'],
            ['Customer support escalations', '8 active', 'Watch'],
          ]}
        />
      </Panel>
    </div>
  );
}

export function SupportAnalyticsPage() {
  return (
    <div className="page-stack">
      <Panel
        title="Support Analytics"
        description="Institution-wide support volume, backlog, and escalation patterns."
      >
        <SimpleTable
          headers={['Metric', 'Current Value', 'Status']}
          rows={[
            ['Open support issues', '38', 'Watch'],
            ['Assigned chats', '24', 'Healthy'],
            ['Escalated support cases', '7', 'Needs review'],
            ['Average first response time', '4m 12s', 'On target'],
          ]}
        />
      </Panel>
    </div>
  );
}

export function NotificationsPage({ session }: SessionProps) {
  const { notificationApi } = useAppClient();
  const [items, setItems] = useState<NotificationCenterItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void notificationApi.getNotifications(session.role).then((result) => {
      if (!cancelled) {
        setItems(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [notificationApi, session.role]);

  return (
    <div className="page-stack">
      <Panel
        title="Notifications"
        description="Operational broadcasts and event notifications in the current scope."
      >
        <SimpleTable
          headers={['Type', 'User', 'Status', 'Sent At']}
          rows={
            items.length > 0
              ? items.map((item) => [
                  titleCase(item.type),
                  item.userLabel,
                  titleCase(item.status),
                  item.sentAt,
                ])
              : [['Loading', '...', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

export function StaffSnapshotPage({ session }: SessionProps) {
  const { dashboardApi } = useAppClient();
  const [staff, setStaff] = useState<StaffRankingItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void dashboardApi.getStaffRanking(session.role).then((result) => {
      if (!cancelled) {
        setStaff(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dashboardApi, session.role]);

  return (
    <div className="page-stack">
      <Panel
        title="Staff Performance"
        description="Performance ranking for the currently visible management scope."
      >
        <SimpleTable
          headers={['Staff', 'Customers', 'Transactions', 'Score']}
          rows={
            staff.length > 0
              ? staff.map((item) => [
                  titleCase(item.staffId),
                  item.customersServed.toLocaleString(),
                  item.transactionsCount.toLocaleString(),
                  item.score.toLocaleString(),
                ])
              : [['Loading', '...', '...', '...']]
          }
        />
      </Panel>
    </div>
  );
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
