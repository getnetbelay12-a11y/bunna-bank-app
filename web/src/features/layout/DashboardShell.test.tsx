import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

const appClient = {
  authApi: {
    login: vi.fn(),
  },
  dashboardApi: {
    getSummary: vi.fn().mockResolvedValue({
      customersServed: 1200,
      transactionsCount: 5400,
      schoolPaymentsCount: 210,
      pendingLoansByLevel: [
        { level: 'branch_review', count: 12 },
        { level: 'district_review', count: 7 },
        { level: 'head_office_review', count: 3 },
      ],
    }),
    getBranchPerformance: vi.fn().mockResolvedValue([
      {
        scopeId: 'bahir_dar_branch',
        customersServed: 320,
        transactionsCount: 1800,
        loanApprovedCount: 20,
        loanRejectedCount: 4,
        schoolPaymentsCount: 80,
        totalTransactionAmount: 4500000,
      },
    ]),
    getDistrictPerformance: vi.fn().mockResolvedValue([
      {
        scopeId: 'north_district',
        customersServed: 840,
        transactionsCount: 5100,
        loanApprovedCount: 63,
        loanRejectedCount: 15,
        schoolPaymentsCount: 230,
        totalTransactionAmount: 14800000,
      },
    ]),
    getStaffRanking: vi.fn().mockResolvedValue([
      {
        staffId: 'hana_worku',
        customersServed: 120,
        transactionsCount: 410,
        loanApprovedCount: 14,
        schoolPaymentsCount: 19,
        score: 620,
      },
    ]),
    getVotingSummary: vi.fn().mockResolvedValue([
      {
        voteId: 'vote_2026',
        title: 'Board Election 2026',
        totalResponses: 78000,
        eligibleShareholders: 180000,
        participationRate: 43.3,
      },
    ]),
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
      items: [
        {
          entityId: 'district_addis',
          entityType: 'district',
          name: 'Addis Ababa District',
          districtName: 'Addis Ababa District',
          membersServed: 4520,
          customersHelped: 4385,
          loansHandled: 1108,
          loansApproved: 586,
          loansEscalated: 82,
          kycCompleted: 912,
          supportResolved: 1094,
          transactionsProcessed: 5980,
          avgHandlingTime: 11.2,
          pendingTasks: 14,
          pendingApprovals: 11,
          responseTimeMinutes: 9.1,
          score: 94,
          status: 'excellent',
        },
        {
          entityId: 'district_bahir',
          entityType: 'district',
          name: 'Bahir Dar District',
          districtName: 'Bahir Dar District',
          membersServed: 3210,
          customersHelped: 2984,
          loansHandled: 812,
          loansApproved: 394,
          loansEscalated: 104,
          kycCompleted: 670,
          supportResolved: 845,
          transactionsProcessed: 4120,
          avgHandlingTime: 13.8,
          pendingTasks: 21,
          pendingApprovals: 16,
          responseTimeMinutes: 13,
          score: 89,
          status: 'excellent',
        },
      ],
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
        loansEscalated: 16,
        kycCompleted: 122,
        supportResolved: 147,
        transactionsProcessed: 1650,
        avgHandlingTime: 19,
        pendingTasks: 8,
        pendingApprovals: 6,
        responseTimeMinutes: 11,
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
  },
  votingApi: {
    getVotes: vi.fn().mockResolvedValue([]),
    createVote: vi.fn(),
    getParticipation: vi.fn().mockResolvedValue(null),
  },
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue([]),
    getTemplates: vi.fn().mockResolvedValue([
      {
        id: 'tpl_1',
        category: 'loan',
        templateType: 'loan_due_soon',
        title: 'Loan due soon reminder',
        subject: 'Loan due soon',
        messageBody: 'Please pay your loan.',
        channelDefaults: ['sms'],
        isActive: true,
      },
    ]),
    getCampaigns: vi.fn().mockResolvedValue([]),
    createCampaign: vi.fn().mockResolvedValue({
      id: 'camp_1',
      category: 'loan',
      templateType: 'loan_due_soon',
      channels: ['sms'],
      targetType: 'filtered_customers',
      targetIds: [],
      messageSubject: 'Loan due soon',
      messageBody: 'Please pay your loan.',
      status: 'draft',
    }),
    sendCampaign: vi.fn().mockResolvedValue({
      id: 'camp_1',
      category: 'loan',
      templateType: 'loan_due_soon',
      channels: ['sms'],
      targetType: 'filtered_customers',
      targetIds: [],
      messageSubject: 'Loan due soon',
      messageBody: 'Please pay your loan.',
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
    getChat: vi.fn(),
    assignChat: vi.fn(),
    reply: vi.fn(),
    resolve: vi.fn(),
    close: vi.fn(),
    updateStatus: vi.fn(),
  },
};

afterEach(() => {
  cleanup();
});

describe('DashboardShell', () => {
  it('shows branch-only navigation for branch manager', () => {
    const session: AdminSession = {
      userId: 'branch_1',
      fullName: 'Hana Worku',
      role: AdminRole.BRANCH_MANAGER,
      branchName: 'Bahir Dar Branch',
    };

    renderWithClient(session);

    expect(screen.getByRole('heading', { level: 1, name: 'Branch Command Center' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /employee performance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^support/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /governance/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /district analytics/i })).not.toBeInTheDocument();
  });

  it('shows district console without governance controls for district manager', () => {
    const session: AdminSession = {
      userId: 'district_1',
      fullName: 'Mulugeta Tadesse',
      role: AdminRole.DISTRICT_MANAGER,
      districtName: 'Bahir Dar District',
    };

    renderWithClient(session);

    expect(screen.getByRole('heading', { level: 1, name: 'District Command Center' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /branch performance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^support/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /district analytics/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /governance/i })).not.toBeInTheDocument();
  });

  it('shows the simplified head office command-center rail', () => {
    const session: AdminSession = {
      userId: 'head_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.HEAD_OFFICE_DIRECTOR,
      branchName: 'Head Office',
    };

    renderWithClient(session);

    expect(screen.getByRole('heading', { level: 1, name: 'Head Office Command Center' })).toBeInTheDocument();
    expect(screen.getByText('Governance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reports/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /risk & alerts/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /audit logs/i })).not.toBeInTheDocument();
    expect(screen.getAllByText('Lulit Mekonnen')).toHaveLength(1);
    expect(screen.getByText('Head Office Director')).toBeInTheDocument();
    expect(screen.getByText('Institution-wide operations')).toBeInTheDocument();
  });

  it('renders the governance page only when head office selects it', () => {
    const session: AdminSession = {
      userId: 'head_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.HEAD_OFFICE_DIRECTOR,
      branchName: 'Head Office',
    };

    renderWithClient(session);
    fireEvent.click(screen.getByRole('button', { name: /^governance/i }));

    expect(screen.getAllByText('Governance').length).toBeGreaterThan(0);
  });

  it('lets head office switch district ranking to transactions handled', async () => {
    const session: AdminSession = {
      userId: 'head_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.HEAD_OFFICE_DIRECTOR,
      branchName: 'Head Office',
    };

    renderWithClient(session);

    const transactionsTab = await screen.findByRole('tab', { name: 'Transactions' });
    fireEvent.click(transactionsTab);

    expect(screen.getByRole('tab', { name: 'Transactions', selected: true })).toBeInTheDocument();
    expect(screen.getByText('Transactions handled')).toBeInTheDocument();
    expect(screen.getByText('5,980')).toBeInTheDocument();
  });
});

function renderWithClient(session: AdminSession) {
  return render(
    <AppClientContext.Provider value={appClient}>
      <DashboardShell session={session} />
    </AppClientContext.Provider>,
  );
}
