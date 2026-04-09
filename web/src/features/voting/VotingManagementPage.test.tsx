import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { VotingManagementPage } from './VotingManagementPage';

describe('VotingManagementPage', () => {
  it('loads and renders vote management rows', async () => {
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
            getVotes: vi.fn().mockResolvedValue([
              {
                voteId: 'vote_2026',
                title: 'Board Election 2026',
                status: 'open',
                totalResponses: 78200,
                participationRate: 43.44,
                eligibleShareholders: 180000,
              },
            ]),
            createVote: vi.fn(),
            openVote: vi.fn(),
            closeVote: vi.fn(),
            getResults: vi.fn().mockResolvedValue([
              { optionId: 'opt_1', optionName: 'Candidate A', votes: 42100, percentage: 53.84 },
            ]),
            getParticipation: vi.fn().mockResolvedValue({
              voteId: 'vote_2026',
              title: 'Board Election 2026',
              totalResponses: 78200,
              eligibleShareholders: 180000,
              participationRate: 43.44,
              uniqueBranches: 24,
              uniqueDistricts: 7,
              branchParticipation: [{ id: 'b1', name: 'Bahir Dar Branch', totalResponses: 9200 }],
              districtParticipation: [{ id: 'd1', name: 'Bahir Dar District', totalResponses: 22800 }],
            }),
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
        }}
      >
        <VotingManagementPage session={session} />
      </AppClientContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('Board Election 2026').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
    expect(screen.getAllByText('78,200').length).toBeGreaterThan(0);
    expect(screen.getAllByText('43%').length).toBeGreaterThan(0);
    expect(screen.getByText('Total shareholders')).toBeInTheDocument();
    expect(screen.getByText('Participation Tracking')).toBeInTheDocument();
  });
});
