import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import type { AppClient } from '../../core/api/appClient';
import type {
  LoanCustomerProfile,
  LoanQueueDetail,
  LoanQueueItem,
  SupportChatDetail,
  SupportChatSummaryItem,
} from '../../core/api/contracts';
import { AdminRole, isSchoolSession } from '../../core/session';
import { LoanMonitoringPage } from '../loan-monitoring/LoanMonitoringPage';
import { SupportChatWorkspace } from '../support/SupportChatWorkspace';

function createUnusedClient(): AppClient {
  return {
    authApi: { login: vi.fn() },
    dashboardApi: {
      getSummary: vi.fn(),
      getBranchPerformance: vi.fn(),
      getDistrictPerformance: vi.fn(),
      getStaffRanking: vi.fn(),
      getVotingSummary: vi.fn(),
      getOnboardingReviewQueue: vi.fn(),
      getAutopayOperations: vi.fn(),
      updateAutopayOperation: vi.fn(),
      updateOnboardingReview: vi.fn(),
      getHeadOfficeDistrictSummary: vi.fn(),
      getHeadOfficeTopDistricts: vi.fn(),
      getHeadOfficeDistrictWatchlist: vi.fn(),
      getDistrictBranchSummary: vi.fn(),
      getDistrictTopBranches: vi.fn(),
      getDistrictBranchWatchlist: vi.fn(),
      getBranchEmployeeSummary: vi.fn(),
      getBranchTopEmployees: vi.fn(),
      getBranchEmployeeWatchlist: vi.fn(),
      getHeadOfficeCommandCenter: vi.fn(),
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
      getCampaigns: vi.fn(),
      createCampaign: vi.fn(),
      sendCampaign: vi.fn(),
      getLogs: vi.fn(),
      getInsuranceAlerts: vi.fn(),
    },
    recommendationApi: {
      getDashboardSummary: vi.fn(),
      getCustomerRecommendations: vi.fn(),
      generateForCustomer: vi.fn(),
    },
    auditApi: {
      getByEntity: vi.fn(),
      getEntityAuditTrail: vi.fn(),
      getByActor: vi.fn(),
    },
    supportApi: {
      getOpenChats: vi.fn(),
      getAssignedChats: vi.fn(),
      getResolvedChats: vi.fn(),
      getChat: vi.fn(),
      assignChat: vi.fn(),
      reply: vi.fn(),
      resolve: vi.fn(),
      close: vi.fn(),
      updateStatus: vi.fn(),
    },
    loanMonitoringApi: {
      getPendingLoans: vi.fn(),
      getLoanDetail: vi.fn(),
      getCustomerProfile: vi.fn(),
      processAction: vi.fn(),
    },
    serviceRequestApi: {
      getRequests: vi.fn(),
      getRequest: vi.fn(),
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

describe('console E2E flows', () => {
  it('supports head office, district, branch, and support demo logins', async () => {
    const { DemoAuthApi } = await import('../../core/api/demoApi');
    const api = new DemoAuthApi();

    const [headOffice, district, branch, support] = await Promise.all([
      api.login({
        identifier: 'admin.head-office@bunnabank.com',
        password: 'demo-pass',
      }),
      api.login({
        identifier: 'district.manager@bunnabank.com',
        password: 'demo-pass',
      }),
      api.login({
        identifier: 'branch.manager@bunnabank.com',
        password: 'demo-pass',
      }),
      api.login({
        identifier: 'support.agent@bunnabank.com',
        password: 'demo-pass',
      }),
    ]);

    if (
      isSchoolSession(headOffice) ||
      isSchoolSession(district) ||
      isSchoolSession(branch) ||
      isSchoolSession(support)
    ) {
      throw new Error('Expected admin demo sessions for console login coverage.');
    }

    expect(headOffice.role).toBe(AdminRole.HEAD_OFFICE_DIRECTOR);
    expect(district.role).toBe(AdminRole.DISTRICT_MANAGER);
    expect(branch.role).toBe(AdminRole.BRANCH_MANAGER);
    expect(support.role).toBe(AdminRole.SUPPORT_AGENT);
  });

  it('stores a staff reply in support chat workflow', async () => {
    const user = userEvent.setup();
    const openChats: SupportChatSummaryItem[] = [
      {
        conversationId: 'chat_1',
        memberId: 'member_1',
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        phoneNumber: '0911000001',
        branchName: 'Bahir Dar Branch',
        status: 'waiting_agent',
        issueCategory: 'loan_issue',
        memberType: 'member',
        priority: 'high',
        escalationFlag: true,
        responseDueAt: '2026-03-12T05:30:00.000Z',
        slaState: 'breached',
        lastMessage: 'Please update me on my loan.',
        updatedAt: '2026-03-12T04:45:00.000Z',
      },
    ];
    const detailState: SupportChatDetail = {
      conversationId: 'chat_1',
      memberId: 'member_1',
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      branchName: 'Bahir Dar Branch',
      status: 'waiting_agent',
      issueCategory: 'loan_issue',
      memberType: 'member',
      priority: 'high',
      assignedAgentId: 'staff_support_1',
      responseDueAt: '2026-03-12T05:30:00.000Z',
      slaState: 'breached',
      assignedToStaffName: 'Rahel Desta',
      messages: [
        {
          id: 'msg_1',
          senderType: 'customer',
          senderName: 'Abebe Kebede',
          message: 'Please update me on my loan.',
          createdAt: '2026-03-12T04:45:00.000Z',
        },
      ],
    };

    const supportApi = {
      getOpenChats: vi.fn().mockResolvedValue(openChats),
      getAssignedChats: vi.fn().mockResolvedValue([]),
      getResolvedChats: vi.fn().mockResolvedValue([]),
      getChat: vi.fn().mockImplementation(async () => structuredClone(detailState)),
      assignChat: vi.fn().mockImplementation(async () => structuredClone(detailState)),
      reply: vi.fn().mockImplementation(async (_chatId: string, message: string) => {
        detailState.messages.push({
          id: `msg_${detailState.messages.length + 1}`,
          senderType: 'staff',
          senderName: 'Rahel Desta',
          message,
          createdAt: '2026-03-12T05:00:00.000Z',
        });
        detailState.status = 'waiting_customer';
        return structuredClone(detailState);
      }),
      resolve: vi.fn().mockImplementation(async () => structuredClone(detailState)),
      close: vi.fn().mockImplementation(async () => structuredClone(detailState)),
      updateStatus: vi.fn().mockImplementation(async () => structuredClone(detailState)),
    };

    const client = {
      ...createUnusedClient(),
      supportApi,
    };

    render(
      <AppClientContext.Provider value={client}>
        <SupportChatWorkspace />
      </AppClientContext.Provider>,
    );

    await user.click(await screen.findByRole('button', { name: /Abebe Kebede/i }));
    await user.clear(screen.getByPlaceholderText('Type your reply to the customer'));
    await user.type(
      screen.getByPlaceholderText('Type your reply to the customer'),
      'Thank you. Your loan is now in branch review.',
    );
    await user.click(screen.getByRole('button', { name: 'Send Reply' }));

    await waitFor(() => {
      expect(supportApi.reply).toHaveBeenCalledWith(
        'chat_1',
        'Thank you. Your loan is now in branch review.',
      );
    });
    expect(
      await screen.findByText('Thank you. Your loan is now in branch review.'),
    ).toBeInTheDocument();
  });

  it('updates loan workflow status from the console', async () => {
    const user = userEvent.setup();
    const queueItem: LoanQueueItem = {
      loanId: 'loan_001',
      memberId: 'member_1',
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      amount: 50000,
      level: 'branch',
      status: 'branch_review',
      deficiencyReasons: [],
      availableActions: ['review', 'approve', 'forward'],
      updatedAt: '2026-03-12T05:00:00.000Z',
    };
    const loanDetailState: LoanQueueDetail = {
      ...queueItem,
      nextAction: 'Approval ready after branch review.',
      history: [],
    };
    const customerProfile: LoanCustomerProfile = {
      memberId: 'member_1',
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      activeLoans: 1,
      closedLoans: 1,
      rejectedLoans: 0,
      totalLoanCount: 2,
      totalBorrowedAmount: 150000,
      totalClosedAmount: 50000,
      repaymentCount90d: 3,
      lastRepaymentAt: '2026-03-11T00:00:00.000Z',
      autopayEnabled: true,
      autopayServices: ['school'],
      repaymentSignal: 'strong',
      loyaltyTier: 'gold',
      nextBestAction: 'Offer pre-approved follow-up after approval.',
      offerCue: 'High-value loyal customer.',
      openSupportCases: 0,
      activeLoanStatuses: ['branch_review'],
    };

    const loanMonitoringApi = {
      getPendingLoans: vi.fn().mockResolvedValue([queueItem]),
      getLoanDetail: vi.fn().mockImplementation(async () => structuredClone(loanDetailState)),
      getCustomerProfile: vi.fn().mockResolvedValue(customerProfile),
      processAction: vi.fn().mockImplementation(async (_loanId: string, payload: { action: string }) => {
        loanDetailState.status = payload.action === 'approve' ? 'approved' : loanDetailState.status;
        loanDetailState.level = payload.action === 'approve' ? 'head_office' : loanDetailState.level;
        return {
          loanId: 'loan_001',
          previousStatus: 'branch_review',
          status: loanDetailState.status,
          currentLevel: loanDetailState.level,
        };
      }),
    };

    const client = {
      ...createUnusedClient(),
      loanMonitoringApi,
    };

    render(
      <AppClientContext.Provider value={client}>
        <LoanMonitoringPage />
      </AppClientContext.Provider>,
    );

    await screen.findByText('Loan Monitoring');
    await user.click(screen.getByRole('button', { name: /Approve/i }));

    await waitFor(() => {
      expect(loanMonitoringApi.processAction).toHaveBeenCalledWith(
        'loan_001',
        expect.objectContaining({ action: 'approve' }),
      );
    });
    expect(await screen.findByText('Workflow updated')).toBeInTheDocument();
  });
});
