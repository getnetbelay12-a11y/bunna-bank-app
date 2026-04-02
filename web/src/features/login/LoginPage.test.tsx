import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { LoginPage } from './LoginPage';

afterEach(() => {
  cleanup();
});

describe('LoginPage', () => {
  it('submits credentials and passes the session to onLogin', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Aster Mengistu',
      role: AdminRole.HEAD_OFFICE_MANAGER,
      branchName: 'Head Office',
    };
    const login = vi.fn().mockResolvedValue(session);

    render(
      <AppClientContext.Provider
        value={{
          authApi: {
            login,
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
        <LoginPage onLogin={onLogin} />
      </AppClientContext.Provider>,
    );

    await user.clear(screen.getByPlaceholderText('Head Office email or demo alias'));
    await user.type(
      screen.getByPlaceholderText('Head Office email or demo alias'),
      'admin@bunna.local',
    );
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(login).toHaveBeenCalledWith({
      identifier: 'admin@bunna.local',
      password: 'Bunna123!',
    });
    expect(onLogin).toHaveBeenCalledWith(session);
  });

  it('shows a clear error message when login fails', async () => {
    const user = userEvent.setup();

    render(
      <AppClientContext.Provider
        value={{
          authApi: {
            login: vi.fn().mockRejectedValue(new Error('Invalid credentials.')),
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
        <LoginPage onLogin={vi.fn()} />
      </AppClientContext.Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password.',
    );
    expect(screen.queryByText(/good morning, head office/i)).not.toBeInTheDocument();
  });
});
