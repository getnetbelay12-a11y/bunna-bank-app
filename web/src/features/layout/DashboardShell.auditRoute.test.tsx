import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import type { AppClient } from '../../core/api/appClient';
import type {
  AuditLogItem,
  SecurityReviewMetrics,
  ServiceRequestItem,
} from '../../core/api/contracts';
import { AdminRole, type AdminSession } from '../../core/session';
import { DashboardShell } from './DashboardShell';

function createShellClient(input: {
  auditItems?: AuditLogItem[];
  securityReviewMetrics?: SecurityReviewMetrics;
}): AppClient {
  const serviceRequests: ServiceRequestItem[] = [
    {
      id: 'security_review_1',
      memberId: 'member_1',
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      type: 'security_review',
      title: 'Security review',
      description: 'Repeated step-up failures.',
      payload: {},
      status: 'submitted',
      slaState: 'overdue',
      followUpState: 'investigation_stalled',
      escalatedAt: '2026-03-18T12:55:00.000Z',
      createdAt: '2026-03-18T10:00:00.000Z',
      updatedAt: '2026-03-18T12:55:00.000Z',
    },
  ];

  return {
    authApi: { login: vi.fn() },
    dashboardApi: {
      getSummary: vi.fn(),
      getBranchPerformance: vi.fn().mockResolvedValue([]),
      getDistrictPerformance: vi.fn(),
      getStaffRanking: vi.fn(),
      getVotingSummary: vi.fn(),
      getOnboardingReviewQueue: vi.fn().mockResolvedValue([]),
      getAutopayOperations: vi.fn().mockResolvedValue([]),
      updateAutopayOperation: vi.fn(),
      updateOnboardingReview: vi.fn(),
      getHeadOfficeDistrictSummary: vi.fn().mockResolvedValue({
        items: [],
        kpis: {
          membersServed: 0,
          customersHelped: 0,
          loansHandled: 0,
          loansApproved: 0,
          loansEscalated: 0,
          kycCompleted: 0,
          supportResolved: 0,
          transactionsProcessed: 0,
          avgHandlingTime: 0,
          pendingTasks: 0,
          pendingApprovals: 0,
          responseTimeMinutes: 0,
        },
      }),
      getHeadOfficeTopDistricts: vi.fn().mockResolvedValue([]),
      getHeadOfficeDistrictWatchlist: vi.fn().mockResolvedValue([]),
      getDistrictBranchSummary: vi.fn(),
      getDistrictTopBranches: vi.fn(),
      getDistrictBranchWatchlist: vi.fn(),
      getBranchEmployeeSummary: vi.fn(),
      getBranchTopEmployees: vi.fn(),
      getBranchEmployeeWatchlist: vi.fn(),
      getHeadOfficeCommandCenter: vi.fn().mockResolvedValue({
        totalCustomers: 0,
        totalSavings: 0,
        totalLoans: 0,
        totalShareholders: 0,
        activeBorrowers: 0,
        activeBranches: 0,
        pendingApprovals: 0,
        riskAlerts: { totalAlerts: 0, loanAlerts: 0 },
        supportOverview: { openChats: 0, escalatedChats: 0 },
        governanceStatus: { activeVotes: 0, shareholderAnnouncements: 0 },
      }),
      getDistrictCommandCenter: vi.fn(),
      getBranchCommandCenter: vi.fn(),
    },
    votingApi: {
      getVotes: vi.fn(),
      createVote: vi.fn(),
      getParticipation: vi.fn(),
    },
    notificationApi: {
      getNotifications: vi.fn(),
      getTemplates: vi.fn(),
      getCampaigns: vi.fn().mockResolvedValue([]),
      createCampaign: vi.fn(),
      sendCampaign: vi.fn(),
      getLogs: vi.fn(),
      getInsuranceAlerts: vi.fn().mockResolvedValue([]),
    },
    recommendationApi: {
      getDashboardSummary: vi.fn(),
      getCustomerRecommendations: vi.fn(),
      generateForCustomer: vi.fn(),
    },
    loanMonitoringApi: {
      getPendingLoans: vi.fn().mockResolvedValue([]),
      getLoanDetail: vi.fn().mockResolvedValue(null),
      getCustomerProfile: vi.fn().mockResolvedValue(null),
      processAction: vi.fn(),
    },
    auditApi: {
      getByEntity: vi.fn().mockResolvedValue(input.auditItems ?? []),
      getEntityAuditTrail: vi.fn().mockResolvedValue(input.auditItems ?? []),
      getByActor: vi.fn().mockResolvedValue([]),
    },
    supportApi: {
      getOpenChats: vi.fn().mockResolvedValue([]),
      getAssignedChats: vi.fn().mockResolvedValue([]),
      getResolvedChats: vi.fn().mockResolvedValue([]),
      getChat: vi.fn(),
      assignChat: vi.fn(),
      reply: vi.fn(),
      resolve: vi.fn(),
      close: vi.fn(),
      updateStatus: vi.fn(),
    },
    serviceRequestApi: {
      getRequests: vi.fn().mockResolvedValue({
        items: serviceRequests,
        total: serviceRequests.length,
        page: 1,
        limit: 20,
      }),
      getRequest: vi.fn().mockResolvedValue(serviceRequests[0]),
      getSecurityReviewMetrics: vi.fn().mockResolvedValue(
        input.securityReviewMetrics ?? {
          metadata: {
            contractVersion: 'security_review_metrics.v99',
            currentStateBasis: 'live_service_request_state',
            historyBasis: 'retained_daily_aggregates_with_event_fallback',
            historyEventTypes: ['investigation_stalled', 'stalled_case_escalated'],
            retentionWindowDays: 14,
          },
          currentState: {
            openCount: 1,
            breachedCount: 1,
            dueSoonCount: 0,
            stalledCount: 1,
            takeoverCount: 1,
          },
          history: {
            stalledLast7Days: 1,
            stalledPrevious7Days: 0,
            takeoversLast7Days: 1,
            takeoversPrevious7Days: 0,
          },
        },
      ),
      reportSecurityReviewMetricsContractIssue: vi.fn().mockResolvedValue({ ok: true }),
      downloadAttachment: vi.fn(),
      getAttachmentMetadata: vi.fn(),
      updateStatus: vi.fn(),
    },
    cardOperationsApi: {
      getRequests: vi.fn(),
      getRequest: vi.fn(),
      updateStatus: vi.fn(),
    },
    paymentOperationsApi: {
      getActivity: vi.fn(),
      getMemberReceipts: vi.fn(),
      downloadAttachment: vi.fn(),
      getAttachmentMetadata: vi.fn(),
    },
  };
}

const session: AdminSession = {
  userId: 'staff_31',
  fullName: 'Head Office Director',
  role: AdminRole.HEAD_OFFICE_DIRECTOR,
  branchName: 'Head Office',
};

describe('DashboardShell audit route integration', () => {
  it('writes the reporting contract audit scope into the URL when opened from the dashboard', async () => {
    const user = userEvent.setup();
    const client = createShellClient({
      auditItems: [
        {
          auditId: 'audit_security_contract_1',
          actor: 'staff_31',
          actorRole: 'head_office_manager',
          action: 'unsupported_security_review_metrics_contract_detected',
          entity: 'staff:staff_31',
          entityType: 'staff',
          entityId: 'staff_31',
          timestamp: '2026-03-18T12:40:00.000Z',
          after: {
            detectedContractVersion: 'security_review_metrics.v99',
          },
        },
      ],
    });

    window.history.replaceState({}, '', '/console/head-office/dashboard');

    render(
      <AppClientContext.Provider value={client}>
        <DashboardShell session={session} initialActive="dashboard" />
      </AppClientContext.Provider>,
    );

    await user.click(await screen.findByRole('button', { name: /Reporting Contract Alerts/i }));

    await waitFor(() => {
      expect(window.location.pathname).toBe('/console/head-office/audit');
      expect(window.location.search).toContain(
        'auditAction=unsupported_security_review_metrics_contract_detected',
      );
    });
  });

  it('restores the audit action scope from the URL on initial audit render', async () => {
    const client = createShellClient({
      auditItems: [
        {
          auditId: 'audit_security_contract_1',
          actor: 'staff_31',
          actorRole: 'head_office_manager',
          action: 'unsupported_security_review_metrics_contract_detected',
          entity: 'staff:staff_31',
          entityType: 'staff',
          entityId: 'staff_31',
          timestamp: '2026-03-18T12:40:00.000Z',
        },
      ],
    });

    window.history.replaceState(
      {},
      '',
      '/console/head-office/audit?auditAction=unsupported_security_review_metrics_contract_detected',
    );

    render(
      <AppClientContext.Provider value={client}>
        <DashboardShell session={session} initialActive="audit" />
      </AppClientContext.Provider>,
    );

    expect(
      await screen.findByText(/Filtered to unsupported security-review metrics contract events/i),
    ).toBeInTheDocument();
  });
});
