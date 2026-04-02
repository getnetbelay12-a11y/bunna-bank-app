import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { DashboardShell } from './DashboardShell';

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
  auditApi: {
    getByEntity: vi.fn().mockResolvedValue([]),
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
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

    expect(screen.getByText('Branch Manager Console')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /members/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /voting & governance/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /district analytics/i })).not.toBeInTheDocument();
  });

  it('shows district console without governance controls for district manager', () => {
    const session: AdminSession = {
      userId: 'district_1',
      fullName: 'Mulugeta Tadesse',
      role: AdminRole.DISTRICT_MANAGER,
      branchName: 'Gondar District',
    };

    renderWithClient(session);
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

    expect(screen.getByText('District Manager Console')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /branch overview/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /district performance/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /voting & governance/i })).not.toBeInTheDocument();
  });

  it('shows governance and audit for head office manager', () => {
    const session: AdminSession = {
      userId: 'head_1',
      fullName: 'Selamawit Assefa',
      role: AdminRole.HEAD_OFFICE_MANAGER,
      branchName: 'Head Office',
    };

    renderWithClient(session);
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

    expect(screen.getByText('Head Office Manager Console')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /voting & governance/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /audit & reports/i })).toBeInTheDocument();
    expect(screen.getAllByText('Selamawit Assefa')).toHaveLength(1);
    expect(screen.getByText('Signed In')).toBeInTheDocument();
    expect(screen.getByText('Institution-wide view')).toBeInTheDocument();
  });

  it('renders the governance page only when head office selects it', () => {
    const session: AdminSession = {
      userId: 'head_1',
      fullName: 'Selamawit Assefa',
      role: AdminRole.HEAD_OFFICE_MANAGER,
      branchName: 'Head Office',
    };

    renderWithClient(session);
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /voting & governance/i }));

    expect(screen.getByText('Voting Management')).toBeInTheDocument();
  });
});

function renderWithClient(session: AdminSession) {
  return render(
    <AppClientContext.Provider value={appClient}>
      <DashboardShell session={session} />
    </AppClientContext.Provider>,
  );
}
