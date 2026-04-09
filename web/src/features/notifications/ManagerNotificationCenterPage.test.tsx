import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { ManagerNotificationCenterPage } from './ManagerNotificationCenterPage';

const session: AdminSession = {
  userId: 'staff_1',
  fullName: 'Lulit Mekonnen',
  role: AdminRole.HEAD_OFFICE_DIRECTOR,
  branchName: 'Head Office',
};

function buildClient(overrides?: {
  createCampaignError?: Error;
  sendCampaignError?: Error;
}) {
  const notificationApi = {
    getNotifications: vi.fn().mockResolvedValue([
      {
        notificationId: 'notif_1',
        type: 'payment',
        userId: 'member_1333',
        userLabel: 'Member 1333',
        status: 'read',
        sentAt: '2026-03-12 10:10',
        actionLabel: 'Open receipts',
        deepLink: '/payments/receipts?filter=qr',
        priority: 'normal',
      },
    ]),
    getTemplates: vi.fn().mockResolvedValue([
      {
        id: 'tpl_loan_due',
        category: 'loan',
        templateType: 'loan_due_soon',
        title: 'Loan Due Soon Reminder',
        subject: 'Loan Due Soon Reminder',
        messageBody: 'Your installment is due soon.',
        channelDefaults: ['email'],
        isActive: true,
      },
    ]),
    getCampaigns: vi.fn().mockResolvedValue([]),
    createCampaign: overrides?.createCampaignError
      ? vi.fn().mockRejectedValue(overrides.createCampaignError)
      : vi.fn().mockResolvedValue({
          id: 'camp_1',
          category: 'loan',
          templateType: 'loan_due_soon',
          channels: ['email'],
          targetType: 'filtered_customers',
          targetIds: [],
          messageSubject: 'Loan Due Soon Reminder',
          messageBody: 'Your installment is due soon.',
          status: 'draft',
        }),
    sendCampaign: overrides?.sendCampaignError
      ? vi.fn().mockRejectedValue(overrides.sendCampaignError)
      : vi.fn().mockResolvedValue({
          id: 'camp_1',
          category: 'loan',
          templateType: 'loan_due_soon',
          channels: ['email'],
          targetType: 'filtered_customers',
          targetIds: [],
          messageSubject: 'Loan Due Soon Reminder',
          messageBody: 'Your installment is due soon.',
          status: 'completed',
        }),
    getLogs: vi.fn().mockResolvedValue([]),
    getInsuranceAlerts: vi.fn().mockResolvedValue([]),
  };

  return {
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
      getVotes: vi.fn(),
      createVote: vi.fn(),
      getParticipation: vi.fn(),
    },
    notificationApi,
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
  };
}

describe('ManagerNotificationCenterPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('sends a reminder and shows success feedback', async () => {
    const client = buildClient();

    render(
      <AppClientContext.Provider value={client}>
        <ManagerNotificationCenterPage session={session} />
      </AppClientContext.Provider>,
    );

    const createPanel = await screen.findByText('Create Reminder Campaign');
    const reminderButton = within(
      createPanel.closest('.panel') as HTMLElement,
    ).getByRole('button', { name: 'Send Reminder' });

    fireEvent.click(reminderButton);

    expect(
      await screen.findByText(/Reminder sent successfully\./i),
    ).toBeInTheDocument();

    expect(client.notificationApi.createCampaign).toHaveBeenCalled();
    expect(client.notificationApi.sendCampaign).toHaveBeenCalledWith('camp_1');
    await waitFor(() => {
      expect(client.notificationApi.getLogs).toHaveBeenCalledWith('camp_1');
    });
  });

  it('shows the backend connectivity error when send fails before a response', async () => {
    const client = buildClient({
      sendCampaignError: new Error(
        'Cannot connect to backend reminder service. Check VITE_API_BASE_URL (http://127.0.0.1:4000), backend port, and local CORS settings.',
      ),
    });

    render(
      <AppClientContext.Provider value={client}>
        <ManagerNotificationCenterPage session={session} />
      </AppClientContext.Provider>,
    );

    const createPanel = await screen.findByText('Create Reminder Campaign');
    const reminderButton = within(
      createPanel.closest('.panel') as HTMLElement,
    ).getByRole('button', { name: 'Send Reminder' });

    fireEvent.click(reminderButton);

    expect(
      await screen.findByText(/Cannot connect to backend reminder service\./i),
    ).toBeInTheDocument();
  });

  it('opens payment receipts from recent notification activity', async () => {
    const client = buildClient();
    const onOpenPaymentReceipts = vi.fn();

    render(
      <AppClientContext.Provider value={client}>
        <ManagerNotificationCenterPage
          session={session}
          onOpenPaymentReceipts={onOpenPaymentReceipts}
        />
      </AppClientContext.Provider>,
    );

    expect(await screen.findByText('Recent Notification Activity')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open receipts' }));

    expect(onOpenPaymentReceipts).toHaveBeenCalledWith({
      memberId: 'member_1333',
      filter: 'qr_payment',
    });
  });
});
