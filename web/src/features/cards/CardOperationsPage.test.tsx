import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { CardOperationsPage } from './CardOperationsPage';

describe('CardOperationsPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('loads card request detail and updates the workflow status', async () => {
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.BRANCH_MANAGER,
      branchName: 'Bahir Dar Branch',
    };

    const getRequests = vi.fn().mockResolvedValue([
      {
        id: 'card_req_1',
        memberId: 'member_1',
        cardId: 'card_1',
        requestType: 'replacement',
        status: 'submitted',
        preferredBranch: 'Bahir Dar Branch',
        reason: 'Card damaged',
        createdAt: '2026-03-10T09:00:00.000Z',
        updatedAt: '2026-03-10T09:00:00.000Z',
      },
    ]);
    const getRequest = vi.fn().mockResolvedValue({
      id: 'card_req_1',
      memberId: 'member_1',
      cardId: 'card_1',
      requestType: 'replacement',
      status: 'submitted',
      preferredBranch: 'Bahir Dar Branch',
      reason: 'Card damaged',
      createdAt: '2026-03-10T09:00:00.000Z',
      updatedAt: '2026-03-10T09:00:00.000Z',
      memberName: 'Abebe Kebede',
      customerId: 'BUN-100001',
      phoneNumber: '0911000001',
      card: {
        id: 'card_1',
        memberId: 'member_1',
        cardType: 'Debit Card',
        last4: '4821',
        status: 'replacement_requested',
        preferredBranch: 'Bahir Dar Branch',
        updatedAt: '2026-03-10T09:00:00.000Z',
      },
      timeline: [
        {
          id: 'evt_1',
          actorType: 'member',
          actorName: 'Abebe Kebede',
          eventType: 'replacement_requested',
          note: 'Card damaged',
          createdAt: '2026-03-10T09:00:00.000Z',
        },
      ],
    });
    const updateStatus = vi.fn().mockResolvedValue({
      card: {
        id: 'card_1',
        memberId: 'member_1',
        cardType: 'Debit Card',
        last4: '4821',
        status: 'active',
        preferredBranch: 'Bahir Dar Branch',
        updatedAt: '2026-03-12T11:15:00.000Z',
      },
      request: {
        id: 'card_req_1',
        memberId: 'member_1',
        cardId: 'card_1',
        requestType: 'replacement',
        status: 'completed',
        preferredBranch: 'Bahir Dar Branch',
        reason: 'Card issuance workflow completed successfully.',
        createdAt: '2026-03-10T09:00:00.000Z',
        updatedAt: '2026-03-12T11:15:00.000Z',
      },
    });

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
          cardOperationsApi: {
            getRequests,
            getRequest,
            updateStatus,
          },
        }}
      >
        <CardOperationsPage session={session} />
      </AppClientContext.Provider>,
    );

    expect(await screen.findByText('Card Operations Snapshot')).toBeInTheDocument();
    expect(await screen.findByText('Card Replacement')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Review request' }));

    expect(await screen.findByText('Abebe Kebede (BUN-100001)')).toBeInTheDocument();
    expect(screen.getByText('Debit Card • **** 4821')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark Completed' }));

    await waitFor(() => {
      expect(updateStatus).toHaveBeenCalledWith('card_req_1', {
        status: 'completed',
        note: 'Card issuance workflow completed successfully.',
      });
    });

    expect(await screen.findByText('Updated Card Replacement request to Completed.')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Request Status Updated')).toBeInTheDocument();
  });

  it('moves a card request into under review from the manager workspace', async () => {
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.BRANCH_MANAGER,
      branchName: 'Bahir Dar Branch',
    };

    const getRequests = vi.fn().mockResolvedValue([
      {
        id: 'card_req_2',
        memberId: 'member_2',
        cardId: 'card_2',
        requestType: 'new_issue',
        status: 'submitted',
        preferredBranch: 'Bahir Dar Branch',
        reason: 'New ATM card issuance for newly approved member account.',
        createdAt: '2026-03-11T09:00:00.000Z',
        updatedAt: '2026-03-11T09:00:00.000Z',
      },
    ]);
    const getRequest = vi.fn().mockResolvedValue({
      id: 'card_req_2',
      memberId: 'member_2',
      cardId: 'card_2',
      requestType: 'new_issue',
      status: 'submitted',
      preferredBranch: 'Bahir Dar Branch',
      reason: 'New ATM card issuance for newly approved member account.',
      createdAt: '2026-03-11T09:00:00.000Z',
      updatedAt: '2026-03-11T09:00:00.000Z',
      memberName: 'Meseret Alemu',
      customerId: 'BUN-100003',
      phoneNumber: '0911000002',
      card: {
        id: 'card_2',
        memberId: 'member_2',
        cardType: 'ATM Card',
        status: 'pending_issue',
        preferredBranch: 'Bahir Dar Branch',
        updatedAt: '2026-03-11T09:00:00.000Z',
      },
      timeline: [
        {
          id: 'evt_1',
          actorType: 'member',
          actorName: 'Meseret Alemu',
          eventType: 'requested',
          note: 'New ATM card issuance for newly approved member account.',
          createdAt: '2026-03-11T09:00:00.000Z',
        },
      ],
    });
    const updateStatus = vi.fn().mockResolvedValue({
      card: {
        id: 'card_2',
        memberId: 'member_2',
        cardType: 'ATM Card',
        status: 'pending_issue',
        preferredBranch: 'Bahir Dar Branch',
        updatedAt: '2026-03-11T10:15:00.000Z',
      },
      request: {
        id: 'card_req_2',
        memberId: 'member_2',
        cardId: 'card_2',
        requestType: 'new_issue',
        status: 'under_review',
        preferredBranch: 'Bahir Dar Branch',
        reason: 'Card operations team is reviewing the request.',
        createdAt: '2026-03-11T09:00:00.000Z',
        updatedAt: '2026-03-11T10:15:00.000Z',
      },
    });

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
          cardOperationsApi: {
            getRequests,
            getRequest,
            updateStatus,
          },
        }}
      >
        <CardOperationsPage session={session} />
      </AppClientContext.Provider>,
    );

    expect(await screen.findByText('New Card Issue')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Review request' }));

    expect(await screen.findByText('Meseret Alemu (BUN-100003)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark Under Review' }));

    await waitFor(() => {
      expect(updateStatus).toHaveBeenCalledWith('card_req_2', {
        status: 'under_review',
        note: 'Card operations team is reviewing the request.',
      });
    });

    expect(await screen.findByText('Updated New Card Issue request to Under Review.')).toBeInTheDocument();
    expect(screen.getAllByText('Under Review').length).toBeGreaterThan(0);
  });
});
