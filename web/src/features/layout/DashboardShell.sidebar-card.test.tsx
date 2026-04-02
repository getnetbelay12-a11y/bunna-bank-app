import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { DashboardShell } from './DashboardShell';

const supportChatDetail = {
  conversationId: 'chat_1',
  customerId: 'CUST-1001',
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
  auditApi: {
    getByEntity: vi.fn().mockResolvedValue([]),
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
      fullName: 'Selamawit Assefa',
      role: AdminRole.HEAD_OFFICE_MANAGER,
      branchName: 'Head Office',
    };

    render(
      <AppClientContext.Provider value={appClient}>
        <DashboardShell session={session} />
      </AppClientContext.Provider>,
    );

    expect(screen.getAllByText('Selamawit Assefa')).toHaveLength(1);
    expect(screen.getByText('Signed In')).toBeInTheDocument();
    expect(screen.getByText('Institution-wide view')).toBeInTheDocument();
  });
});
