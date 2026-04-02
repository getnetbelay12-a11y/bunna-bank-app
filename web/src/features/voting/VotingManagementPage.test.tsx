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
            getVotes: vi.fn().mockResolvedValue([
              {
                voteId: 'vote_2026',
                title: 'Board Election 2026',
                status: 'open',
                totalResponses: 78200,
                participationRate: 43.44,
              },
            ]),
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
        <VotingManagementPage session={session} />
      </AppClientContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Board Election 2026')).toBeInTheDocument();
    });

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('78,200')).toBeInTheDocument();
    expect(screen.getByText('43%')).toBeInTheDocument();
  });
});
