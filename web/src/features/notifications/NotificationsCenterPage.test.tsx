import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { NotificationsCenterPage } from './NotificationsCenterPage';

function buildClient() {
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
    notificationApi: {
      getNotifications: vi.fn().mockResolvedValue([
        {
          notificationId: 'notif_1',
          type: 'payment',
          userLabel: 'Member 1333',
          status: 'read',
          sentAt: '2026-03-12 10:10',
          actionLabel: 'Open receipts',
          deepLink: '/payments/receipts?filter=qr',
          priority: 'normal',
        },
        {
          notificationId: 'notif_2',
          type: 'service_request',
          userLabel: 'Member 1444',
          status: 'sent',
          sentAt: '2026-03-12 11:20',
          actionLabel: 'Open receipts',
          deepLink: '/payments/receipts?filter=disputes',
          priority: 'high',
        },
      ]),
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
    serviceRequestApi: {
      getRequests: vi.fn(),
      getRequest: vi.fn(),
      getAttachmentMetadata: vi.fn(),
      downloadAttachment: vi.fn(),
      updateStatus: vi.fn(),
    },
    paymentOperationsApi: {
      getActivity: vi.fn(),
      getMemberReceipts: vi.fn(),
      getAttachmentMetadata: vi.fn(),
      downloadAttachment: vi.fn(),
    },
    cardOperationsApi: {
      getRequests: vi.fn(),
      getRequest: vi.fn(),
      updateStatus: vi.fn(),
    },
    performanceApi: {
      getRolePerformanceOverview: vi.fn(),
    },
  };
}

describe('NotificationsCenterPage', () => {
  it('renders notification actions and deep-link targets including payment receipts', async () => {
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.HEAD_OFFICE_MANAGER,
    };

    render(
      <AppClientContext.Provider value={buildClient()}>
        <NotificationsCenterPage session={session} />
      </AppClientContext.Provider>,
    );

    expect(await screen.findByText('Notifications Center')).toBeInTheDocument();
    expect(await screen.findAllByText('Open receipts')).toHaveLength(2);
    expect(screen.getByText('/payments/receipts?filter=qr')).toBeInTheDocument();
    expect(
      screen.getByText('/payments/receipts?filter=disputes'),
    ).toBeInTheDocument();
  });
});
