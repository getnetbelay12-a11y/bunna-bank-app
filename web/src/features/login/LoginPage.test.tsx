import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('uses the left role selector to drive login copy and submits credentials', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.HEAD_OFFICE_DIRECTOR,
      branchName: 'Head Office',
    };

    render(
      <AppClientContext.Provider
        value={{
          authApi: {
            login: vi.fn().mockResolvedValue(session),
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
        }}
      >
        <LoginPage onLogin={onLogin} />
      </AppClientContext.Provider>,
    );

    expect(
      screen.queryByText('Institution-wide control'),
    ).not.toBeInTheDocument();

    await user.click(
      screen
        .getAllByRole('button')
        .find((button) => button.textContent?.startsWith('Branch'))!,
    );
    expect(screen.getByText('Secure Branch Staff Login')).toBeInTheDocument();

    await user.click(
      screen
        .getAllByRole('button')
        .find((button) => button.textContent?.startsWith('Head Office'))!,
    );
    expect(screen.getByText('Secure Head Office Staff Login')).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Email or staff identifier'));
    await user.type(
      screen.getByPlaceholderText('Email or staff identifier'),
      'admin.head-office@bunnabank.com',
    );
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(onLogin).toHaveBeenCalledWith(session);
  });
});
