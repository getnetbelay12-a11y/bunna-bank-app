import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { DashboardShell } from './DashboardShell';

const emptyOverview = {
  scope: 'district',
  period: 'week',
  generatedAt: new Date('2026-03-12T00:00:00.000Z').toISOString(),
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
    score: 0,
    status: 'good' as const,
  },
  items: [],
};

const supportChatDetail = {
  conversationId: 'chat_1',
  customerId: 'BUN-100001',
  status: 'open',
  issueCategory: 'general_support',
  memberType: 'member',
  messages: [],
};

const appClient = {
  authApi: {
    login: vi.fn(),
  },
  dashboardApi: {
    getSummary: vi.fn().mockResolvedValue({
      customersServed: 1200,
      transactionsCount: 5400,
      schoolPaymentsCount: 210,
      pendingLoansByLevel: [],
    }),
    getBranchPerformance: vi.fn().mockResolvedValue([]),
    getDistrictPerformance: vi.fn().mockResolvedValue([]),
    getStaffRanking: vi.fn().mockResolvedValue([]),
    getVotingSummary: vi.fn().mockResolvedValue([]),
    getOnboardingReviewQueue: vi.fn().mockResolvedValue([]),
    getAutopayOperations: vi.fn().mockResolvedValue([]),
    updateAutopayOperation: vi.fn(),
    updateOnboardingReview: vi.fn(),
    getHeadOfficeDistrictSummary: vi.fn().mockResolvedValue({
      scope: 'district',
      period: 'week',
      generatedAt: new Date('2026-03-12T00:00:00.000Z').toISOString(),
      kpis: {
        membersServed: 1200,
        customersHelped: 1100,
        loansHandled: 320,
        loansApproved: 180,
        loansEscalated: 22,
        kycCompleted: 260,
        supportResolved: 290,
        transactionsProcessed: 4200,
        avgHandlingTime: 18,
        pendingTasks: 12,
        pendingApprovals: 9,
        responseTimeMinutes: 12,
        score: 86,
        status: 'good',
      },
      items: [],
    }),
    getHeadOfficeTopDistricts: vi.fn().mockResolvedValue([]),
    getHeadOfficeDistrictWatchlist: vi.fn().mockResolvedValue([]),
    getDistrictBranchSummary: vi.fn().mockResolvedValue({
      scope: 'branch',
      period: 'week',
      generatedAt: new Date('2026-03-12T00:00:00.000Z').toISOString(),
      kpis: {
        membersServed: 900,
        customersHelped: 860,
        loansHandled: 220,
        loansApproved: 121,
        loansEscalated: 18,
        kycCompleted: 194,
        supportResolved: 220,
        transactionsProcessed: 2800,
        avgHandlingTime: 20,
        pendingTasks: 14,
        pendingApprovals: 10,
        responseTimeMinutes: 15,
        score: 79,
        status: 'good',
      },
      items: [],
    }),
    getDistrictTopBranches: vi.fn().mockResolvedValue([]),
    getDistrictBranchWatchlist: vi.fn().mockResolvedValue([]),
    getBranchEmployeeSummary: vi.fn().mockResolvedValue({
      scope: 'employee',
      period: 'week',
      generatedAt: new Date('2026-03-12T00:00:00.000Z').toISOString(),
      kpis: {
        membersServed: 620,
        customersHelped: 640,
        loansHandled: 150,
        loansApproved: 71,
        loansEscalated: 10,
        kycCompleted: 180,
        supportResolved: 140,
        transactionsProcessed: 1100,
        avgHandlingTime: 16,
        pendingTasks: 5,
        pendingApprovals: 3,
        responseTimeMinutes: 10,
        score: 84,
        status: 'good',
      },
      items: [],
    }),
    getBranchTopEmployees: vi.fn().mockResolvedValue([]),
    getBranchEmployeeWatchlist: vi.fn().mockResolvedValue([]),
    getHeadOfficeCommandCenter: vi.fn().mockResolvedValue({
      totalCustomers: 0,
      totalShareholders: 0,
      totalSavings: 0,
      totalLoans: 0,
      pendingApprovals: 0,
      riskAlerts: { totalAlerts: 0, loanAlerts: 0, kycAlerts: 0, supportAlerts: 0, notificationAlerts: 0 },
      districtPerformance: emptyOverview,
      supportOverview: { openChats: 0, assignedChats: 0, resolvedChats: 0, escalatedChats: 0 },
      governanceStatus: { activeVotes: 0, draftVotes: 0, publishedVotes: 0, shareholderAnnouncements: 0 },
    }),
    getDistrictCommandCenter: vi.fn().mockResolvedValue({
      branchList: [],
      branchRanking: [],
      loanApprovalsPerBranch: [],
      kycCompletion: { completed: 0, pendingReview: 0, needsAction: 0, completionRate: 0 },
      supportMetrics: { openChats: 0, assignedChats: 0, resolvedChats: 0, escalatedChats: 0 },
    }),
    getBranchCommandCenter: vi.fn().mockResolvedValue({
      employeePerformance: emptyOverview,
      loansHandled: 0,
      kycCompleted: 0,
      supportHandled: 0,
      pendingTasks: 0,
    }),
    getVotingPerformance: vi.fn().mockResolvedValue([]),
    getSupportQueue: vi.fn().mockResolvedValue([]),
    getNotifications: vi.fn().mockResolvedValue([]),
    getReports: vi.fn().mockResolvedValue([]),
    getAuditLogs: vi.fn().mockResolvedValue([]),
  },
  votingApi: {
    getVotes: vi.fn().mockResolvedValue([]),
    createVote: vi.fn().mockResolvedValue(undefined),
    getParticipation: vi.fn().mockResolvedValue(null),
  },
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue([]),
    getTemplates: vi.fn().mockResolvedValue([]),
    getCampaigns: vi.fn().mockResolvedValue([]),
    createCampaign: vi.fn().mockResolvedValue({
      id: 'campaign_1',
      category: 'loan',
      templateType: 'approval',
      channels: ['in_app'],
      targetType: 'single_customer',
      targetIds: [],
      messageBody: 'demo',
      status: 'draft',
    }),
    sendCampaign: vi.fn().mockResolvedValue({
      id: 'campaign_1',
      category: 'loan',
      templateType: 'approval',
      channels: ['in_app'],
      targetType: 'single_customer',
      targetIds: [],
      messageBody: 'demo',
      status: 'completed',
    }),
    getLogs: vi.fn().mockResolvedValue([]),
    getInsuranceAlerts: vi.fn().mockResolvedValue([]),
  },
  recommendationApi: {
    getDashboardSummary: vi.fn().mockResolvedValue({
      recommendationsGeneratedToday: 12,
      topRecommendationType: 'customer_followup',
      completionRate: 35,
      dismissedRate: 8,
      highOpportunityCustomers: 6,
      customersMissingKyc: 2,
      customersSuitableForAutopay: 4,
    }),
    getCustomerRecommendations: vi.fn().mockResolvedValue({
      title: 'Smart Recommendations',
      recommendations: [],
    }),
    generateForCustomer: vi.fn().mockResolvedValue(undefined),
  },
  auditApi: {
    getByEntity: vi.fn().mockResolvedValue([]),
    getEntityAuditTrail: vi.fn().mockResolvedValue([]),
    getByActor: vi.fn().mockResolvedValue([]),
  },
  supportApi: {
    getOpenChats: vi.fn().mockResolvedValue([]),
    getAssignedChats: vi.fn().mockResolvedValue([]),
    getResolvedChats: vi.fn().mockResolvedValue([]),
    getChat: vi.fn().mockResolvedValue(supportChatDetail),
    assignChat: vi.fn().mockResolvedValue(supportChatDetail),
    reply: vi.fn().mockResolvedValue(supportChatDetail),
    resolve: vi.fn().mockResolvedValue(supportChatDetail),
    close: vi.fn().mockResolvedValue(supportChatDetail),
    updateStatus: vi.fn().mockResolvedValue(supportChatDetail),
  },
};

afterEach(() => {
  cleanup();
});

describe('DashboardShell sidebar signed-in card', () => {
  it('shows the full name only once in the top-right header', () => {
    const session: AdminSession = {
      userId: 'head_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.HEAD_OFFICE_DIRECTOR,
      branchName: 'Head Office',
    };

    render(
      <AppClientContext.Provider value={appClient}>
        <DashboardShell session={session} />
      </AppClientContext.Provider>,
    );

    expect(screen.getAllByText('Lulit Mekonnen')).toHaveLength(1);
    expect(screen.getByText('Head Office Director')).toBeInTheDocument();
    expect(screen.getByText('Institution-wide operations')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open notifications/i })).toBeInTheDocument();
  });
});
