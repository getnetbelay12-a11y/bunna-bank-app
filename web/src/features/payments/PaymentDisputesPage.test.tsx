import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { PaymentDisputesPage } from './PaymentDisputesPage';

describe('PaymentDisputesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters to payment-related service requests and updates a dispute status', async () => {
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.BRANCH_MANAGER,
      branchName: 'Bahir Dar Branch',
    };

    const getRequests = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'svc_pay_1',
          memberId: 'member_1',
          customerId: 'BUN-100001',
          memberName: 'Abebe Kebede',
          branchName: 'Bahir Dar Branch',
          type: 'payment_dispute',
          title: 'Merchant charge dispute',
          description: 'Customer reported duplicate merchant charge.',
          status: 'submitted',
          createdAt: '2026-03-10T09:00:00.000Z',
          updatedAt: '2026-03-10T09:00:00.000Z',
        },
        {
          id: 'svc_phone_1',
          memberId: 'member_2',
          customerId: 'BUN-100002',
          memberName: 'Meseret Alemu',
          branchName: 'Gondar Branch',
          type: 'phone_update',
          title: 'Phone update',
          description: 'Change phone number',
          status: 'submitted',
          createdAt: '2026-03-10T09:00:00.000Z',
          updatedAt: '2026-03-10T09:00:00.000Z',
        },
      ],
      total: 2,
      page: 1,
      limit: 20,
    });
    const getRequest = vi.fn().mockResolvedValue({
      id: 'svc_pay_1',
      memberId: 'member_1',
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      branchName: 'Bahir Dar Branch',
      type: 'payment_dispute',
      title: 'Merchant charge dispute',
      description: 'Customer reported duplicate merchant charge.',
      status: 'submitted',
      latestNote: 'Awaiting review.',
      attachments: ['receipt.png'],
      payload: {
        transactionReference: 'TXN-2026-001',
        amount: 12000,
        counterparty: 'Dashen Bank',
        occurredAt: '2026-03-09T14:30:00.000Z',
      },
      timeline: [
        {
          id: 'evt_1',
          actorType: 'member',
          actorName: 'Abebe Kebede',
          eventType: 'submitted',
          toStatus: 'submitted',
          note: 'Customer reported duplicate merchant charge.',
          createdAt: '2026-03-10T09:00:00.000Z',
        },
      ],
      createdAt: '2026-03-10T09:00:00.000Z',
      updatedAt: '2026-03-10T09:00:00.000Z',
    });
    const updateStatus = vi.fn().mockResolvedValue({
      id: 'svc_pay_1',
      memberId: 'member_1',
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      branchName: 'Bahir Dar Branch',
      type: 'payment_dispute',
      title: 'Merchant charge dispute',
      description: 'Customer reported duplicate merchant charge.',
      status: 'completed',
      latestNote: 'Payment dispute review completed successfully.',
      attachments: ['receipt.png'],
      payload: {
        transactionReference: 'TXN-2026-001',
        amount: 12000,
        counterparty: 'Dashen Bank',
        occurredAt: '2026-03-09T14:30:00.000Z',
      },
      timeline: [
        {
          id: 'evt_1',
          actorType: 'member',
          actorName: 'Abebe Kebede',
          eventType: 'submitted',
          toStatus: 'submitted',
          note: 'Customer reported duplicate merchant charge.',
          createdAt: '2026-03-10T09:00:00.000Z',
        },
      ],
      createdAt: '2026-03-10T09:00:00.000Z',
      updatedAt: '2026-03-12T11:15:00.000Z',
    });
    const getMemberReceipts = vi.fn().mockResolvedValue([
      {
        receiptId: 'receipt_dispute_1',
        receiptType: 'payment_dispute',
        sourceId: 'svc_pay_1',
        title: 'Merchant charge dispute',
        description: 'Awaiting review.',
        status: 'submitted',
        amount: 12000,
        currency: 'ETB',
        transactionReference: 'TXN-2026-001',
        counterparty: 'Dashen Bank',
        attachments: ['receipt.png'],
        recordedAt: '2026-03-10T09:00:00.000Z',
        metadata: {
          occurredAt: '2026-03-09T14:30:00.000Z',
        },
      },
    ]);
    const getAttachmentMetadata = vi.fn().mockResolvedValue({
      provider: 'local',
      storageKey: 'receipt.png',
      originalFileName: 'receipt.png',
      mimeType: 'image/png',
      sizeBytes: 40960,
    });
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(window);
    const objectUrlSpy = vi.fn(() => 'blob:payment-dispute-evidence');
    const revokeObjectUrlSpy = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: objectUrlSpy,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrlSpy,
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
          serviceRequestApi: {
            getRequests,
            getRequest,
            getAttachmentMetadata: vi.fn(),
            downloadAttachment: vi.fn(),
            updateStatus,
          },
          paymentOperationsApi: {
            getActivity: vi.fn(),
            getMemberReceipts,
            getAttachmentMetadata,
            downloadAttachment: vi.fn().mockResolvedValue(new Blob(['demo'])),
          },
        }}
      >
        <PaymentDisputesPage session={session} />
      </AppClientContext.Provider>,
    );

    expect(await screen.findByText('Payment Disputes')).toBeInTheDocument();
    expect(await screen.findByText('Abebe Kebede (BUN-100001)')).toBeInTheDocument();
    expect(screen.queryByText('Meseret Alemu (BUN-100002)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Review dispute' }));

    expect(await screen.findByText('Merchant charge dispute')).toBeInTheDocument();
    expect(await screen.findByText('Latest note:')).toBeInTheDocument();
    expect(screen.getByText('Awaiting review.')).toBeInTheDocument();
    expect(screen.getByText('Transaction Reference')).toBeInTheDocument();
    expect(screen.getAllByText('TXN-2026-001')).toHaveLength(2);
    expect(screen.getAllByText('ETB 12,000')).toHaveLength(2);
    expect(screen.getByText('Dashen Bank')).toBeInTheDocument();
    expect(screen.getByText('Submitted Evidence')).toBeInTheDocument();
    expect(screen.getAllByText('receipt.png')).toHaveLength(2);
    expect(await screen.findAllByText('Merchant charge dispute')).toHaveLength(2);
    expect(screen.getAllByText('Payment Dispute')).toHaveLength(3);
    expect(screen.queryByText('No file uploaded')).not.toBeInTheDocument();
    expect(await screen.findByText('Image')).toBeInTheDocument();
    expect(screen.getByText('40 KB')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(await screen.findByText('Opened payment evidence receipt.png.')).toBeInTheDocument();
    expect(objectUrlSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      'blob:payment-dispute-evidence',
      '_blank',
      'noopener,noreferrer',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark Completed' }));

    await waitFor(() => {
      expect(updateStatus).toHaveBeenCalledWith('svc_pay_1', {
        status: 'completed',
        note: 'Payment dispute review completed successfully.',
      });
    });

    expect(await screen.findByText('Updated payment case BUN-100001 to Completed.')).toBeInTheDocument();
  });
});
