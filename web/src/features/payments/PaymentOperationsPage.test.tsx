import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { PaymentOperationsPage } from './PaymentOperationsPage';

describe('PaymentOperationsPage', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads member payment history and filters to qr receipts', async () => {
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.BRANCH_MANAGER,
      branchName: 'Bahir Dar Branch',
    };

    const getActivity = vi.fn().mockResolvedValue([
      {
        memberId: 'member_2',
        customerId: 'BUN-100002',
        memberName: 'Meseret Alemu',
        phone: '0911000002',
        branchName: 'Gondar Branch',
        openCases: 1,
        totalReceipts: 1,
        qrPayments: 0,
        schoolPayments: 1,
        disputeReceipts: 1,
        latestActivityAt: '2026-03-12T09:00:00.000Z',
      },
      {
        memberId: 'member_1',
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        phone: '0911000001',
        branchName: 'Bahir Dar Branch',
        openCases: 1,
        totalReceipts: 2,
        qrPayments: 1,
        schoolPayments: 0,
        disputeReceipts: 1,
        latestActivityAt: '2026-03-10T09:00:00.000Z',
      },
    ]);

    const getMemberReceipts = vi.fn().mockImplementation(async (memberId: string) => {
      if (memberId === 'member_2') {
        return [
          {
            receiptId: 'receipt_school_1',
            receiptType: 'school_payment',
            sourceId: 'school_payment_1',
            title: 'Blue Nile Academy',
            description: 'School payment for Blue Nile Academy.',
            status: 'successful',
            amount: 1500,
            currency: 'ETB',
            channel: 'mobile',
            attachments: [],
            recordedAt: '2026-03-08T10:15:00.000Z',
            metadata: {
              studentId: 'ST-1001',
            },
          },
        ];
      }

      return [
        {
          receiptId: 'receipt_qr_1',
          receiptType: 'qr_payment',
          sourceId: 'txn_qr_1',
          title: 'ABa Cafe',
          description: 'QR payment to ABa Cafe',
          status: 'successful',
          amount: 275,
          currency: 'ETB',
          transactionReference: 'QRP-2026-001',
          counterparty: 'ABa Cafe',
          attachments: [],
          recordedAt: '2026-03-11T08:40:00.000Z',
          metadata: {
            qrPayload: 'merchant:aba-cafe',
          },
        },
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
      ];
    });
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(window);
    const objectUrlSpy = vi.fn(() => 'blob:payment-operations-evidence');
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
            getRequests: vi.fn(),
            getRequest: vi.fn(),
            getAttachmentMetadata: vi.fn(),
            downloadAttachment: vi.fn(),
            updateStatus: vi.fn(),
          },
          paymentOperationsApi: {
            getActivity,
            getMemberReceipts,
            getAttachmentMetadata: vi.fn(),
            downloadAttachment: vi.fn().mockResolvedValue(new Blob(['demo'])),
          },
        }}
      >
        <PaymentOperationsPage session={session} />
      </AppClientContext.Provider>,
    );

    expect(await screen.findByText('Payment Operations Snapshot')).toBeInTheDocument();
    expect(await screen.findByText('Meseret Alemu · Payment History')).toBeInTheDocument();
    expect(await screen.findByText('Blue Nile Academy')).toBeInTheDocument();
    expect(await screen.findByText('School Payment')).toBeInTheDocument();
    expect(await screen.findByText('0911000002')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Review payments' })[1]);

    expect(await screen.findAllByText('Abebe Kebede · Payment History')).toHaveLength(1);
    expect(await screen.findByText('ABa Cafe')).toBeInTheDocument();
    expect(await screen.findByText('QRP-2026-001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'QR (1)' }));

    expect(screen.getByText('Qr Payment')).toBeInTheDocument();
    expect(screen.getByText('No evidence')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Disputes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(await screen.findByText('Opened payment evidence receipt.png.')).toBeInTheDocument();
    expect(objectUrlSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      'blob:payment-operations-evidence',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('honors notification handoff member and receipt filter context', async () => {
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.BRANCH_MANAGER,
      branchName: 'Bahir Dar Branch',
    };

    const getActivity = vi.fn().mockResolvedValue([
      {
        memberId: 'member_1',
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        phone: '0911000001',
        branchName: 'Bahir Dar Branch',
        openCases: 1,
        totalReceipts: 2,
        qrPayments: 1,
        schoolPayments: 0,
        disputeReceipts: 1,
        latestActivityAt: '2026-03-10T09:00:00.000Z',
      },
      {
        memberId: 'member_2',
        customerId: 'BUN-100002',
        memberName: 'Meseret Alemu',
        phone: '0911000002',
        branchName: 'Gondar Branch',
        openCases: 0,
        totalReceipts: 1,
        qrPayments: 0,
        schoolPayments: 1,
        disputeReceipts: 0,
        latestActivityAt: '2026-03-12T09:00:00.000Z',
      },
    ]);

    const getMemberReceipts = vi.fn().mockResolvedValue([
      {
        receiptId: 'receipt_qr_1',
        receiptType: 'qr_payment',
        sourceId: 'txn_qr_1',
        title: 'ABa Cafe',
        description: 'QR payment to ABa Cafe',
        status: 'successful',
        amount: 275,
        currency: 'ETB',
        transactionReference: 'QRP-2026-001',
        counterparty: 'ABa Cafe',
        attachments: [],
        recordedAt: '2026-03-11T08:40:00.000Z',
        metadata: {},
      },
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
        metadata: {},
      },
    ]);

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
            getRequests: vi.fn(),
            getRequest: vi.fn(),
            getAttachmentMetadata: vi.fn(),
            downloadAttachment: vi.fn(),
            updateStatus: vi.fn(),
          },
          paymentOperationsApi: {
            getActivity,
            getMemberReceipts,
            getAttachmentMetadata: vi.fn(),
            downloadAttachment: vi.fn().mockResolvedValue(new Blob(['demo'])),
          },
        }}
      >
        <PaymentOperationsPage
          session={session}
          initialMemberId="member_1"
          initialFilter="payment_dispute"
          returnContextLabel="Notification Center"
          onReturnToContext={vi.fn()}
        />
      </AppClientContext.Provider>,
    );

    expect(await screen.findByText('Opened from Notification Center')).toBeInTheDocument();
    expect(await screen.findByText('Abebe Kebede · Payment History')).toBeInTheDocument();
    expect(await screen.findByText('Merchant charge dispute')).toBeInTheDocument();
    expect(screen.queryByText('ABa Cafe')).not.toBeInTheDocument();
    expect(getMemberReceipts).toHaveBeenCalledWith('member_1');
  });
});
