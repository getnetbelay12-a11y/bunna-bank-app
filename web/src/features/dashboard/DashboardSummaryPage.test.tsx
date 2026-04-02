import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { DashboardSummaryPage } from './DashboardSummaryPage';

describe('DashboardSummaryPage', () => {
  it('loads and renders dashboard summary data', async () => {
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Selamawit Assefa',
      role: AdminRole.ADMIN,
      branchName: 'Head Office',
    };

    render(
      <AppClientContext.Provider
        value={{
          authApi: {
            login: vi.fn(),
          },
          dashboardApi: {
            getSummary: vi.fn().mockResolvedValue({
              customersServed: 1284,
              transactionsCount: 8420,
              schoolPaymentsCount: 528,
              pendingLoansByLevel: [
                { level: 'branch_review', count: 96 },
              ],
            }),
            getBranchPerformance: vi.fn(),
            getDistrictPerformance: vi.fn(),
            getStaffRanking: vi.fn(),
            getVotingSummary: vi.fn().mockResolvedValue([
              {
                voteId: 'vote_2026',
                title: 'Board Election 2026',
                totalResponses: 78200,
                eligibleShareholders: 180000,
                participationRate: 43.44,
              },
            ]),
            getHeadOfficeDistrictSummary: vi.fn(),
            getHeadOfficeTopDistricts: vi.fn(),
            getHeadOfficeDistrictWatchlist: vi.fn(),
            getDistrictBranchSummary: vi.fn(),
            getDistrictTopBranches: vi.fn(),
            getDistrictBranchWatchlist: vi.fn(),
            getBranchEmployeeSummary: vi.fn(),
            getBranchTopEmployees: vi.fn(),
            getBranchEmployeeWatchlist: vi.fn(),
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
          auditApi: {
            getByEntity: vi.fn(),
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
        }}
      >
        <DashboardSummaryPage session={session} />
      </AppClientContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('1284')).toBeInTheDocument();
    });

    expect(screen.getByText('8420')).toBeInTheDocument();
    expect(screen.getByText('528')).toBeInTheDocument();
    expect(screen.getByText('43%')).toBeInTheDocument();
    expect(screen.getByText('Branch Review')).toBeInTheDocument();
  });
});
