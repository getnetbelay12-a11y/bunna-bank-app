import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { SupportWatchlistPanel } from './SupportWatchlistPanel';

describe('SupportWatchlistPanel', () => {
  it('filters to needs-attention chats and keeps the active-view summary in sync', async () => {
    const user = userEvent.setup();
    const onOpenChat = vi.fn();

    render(
      <AppClientContext.Provider
        value={{
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
            getOpenChats: vi.fn().mockResolvedValue([
              {
                conversationId: 'chat_open',
                customerId: 'BUN-100001',
                memberName: 'Abebe Kebede',
                status: 'open',
                priority: 'normal',
                escalationFlag: false,
                updatedAt: '2026-03-18T09:00:00.000Z',
              },
            ]),
            getAssignedChats: vi.fn().mockResolvedValue([
              {
                conversationId: 'chat_high',
                customerId: 'BUN-100002',
                memberName: 'Mulu Hailu',
                status: 'assigned',
                priority: 'high',
                escalationFlag: false,
                updatedAt: '2026-03-18T08:00:00.000Z',
              },
            ]),
            getResolvedChats: vi.fn().mockResolvedValue([
              {
                conversationId: 'chat_done',
                customerId: 'BUN-100003',
                memberName: 'Sara Tadesse',
                status: 'resolved',
                priority: 'low',
                escalationFlag: false,
                updatedAt: '2026-03-17T08:00:00.000Z',
              },
            ]),
            getChat: vi.fn(),
            assignChat: vi.fn(),
            reply: vi.fn(),
            resolve: vi.fn(),
            close: vi.fn(),
            updateStatus: vi.fn(),
          },
        }}
      >
        <SupportWatchlistPanel
          title="Support Watchlist"
          description="Support triage"
          onOpenChat={onOpenChat}
        />
      </AppClientContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Abebe Kebede')).toBeInTheDocument();
      expect(screen.getByText('Mulu Hailu')).toBeInTheDocument();
      expect(screen.getByText('Sara Tadesse')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Needs Attention (2)' }));

    expect(screen.getByText('Needs attention (2)')).toBeInTheDocument();
    expect(screen.getByText('Abebe Kebede')).toBeInTheDocument();
    expect(screen.getByText('Mulu Hailu')).toBeInTheDocument();
    expect(screen.queryByText('Sara Tadesse')).toBeNull();

    await user.click(screen.getAllByRole('button', { name: 'Open chat' })[0]);

    expect(onOpenChat).toHaveBeenCalled();
  });
});
