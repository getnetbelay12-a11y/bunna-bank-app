import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { ServiceRequestsPage } from './ServiceRequestsPage';

describe('ServiceRequestsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows structured metadata for phone update workflows', async () => {
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Lulit Mekonnen',
      role: AdminRole.BRANCH_MANAGER,
      branchName: 'Gondar Branch',
    };

    const getRequests = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'svc_2',
          memberId: 'member_2',
          customerId: 'BUN-100003',
          memberName: 'Meseret Alemu',
          branchName: 'Gondar Branch',
          type: 'phone_update',
          title: 'Phone number update request',
          description: 'Customer requested to replace the number linked to the account.',
          status: 'awaiting_customer',
          createdAt: '2026-03-09T14:20:00.000Z',
          updatedAt: '2026-03-11T08:30:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
    const getRequest = vi.fn().mockResolvedValue({
      id: 'svc_2',
      memberId: 'member_2',
      customerId: 'BUN-100003',
      memberName: 'Meseret Alemu',
      phoneNumber: '0911000002',
      branchName: 'Gondar Branch',
      type: 'phone_update',
      title: 'Phone number update request',
      description: 'Customer requested to replace the number linked to the account.',
      status: 'awaiting_customer',
      latestNote: 'Please upload a clearer selfie verification image.',
      createdAt: '2026-03-09T14:20:00.000Z',
      updatedAt: '2026-03-11T08:30:00.000Z',
      payload: {
        requestedPhoneNumber: '0911000099',
      },
      attachments: ['fayda-front.jpg', 'selfie.jpg'],
      timeline: [],
    });
    const getAttachmentMetadata = vi.fn().mockImplementation(async (storageKey: string) => ({
      provider: 'local',
      storageKey,
      originalFileName: storageKey,
      mimeType: 'image/jpeg',
      sizeBytes: storageKey === 'fayda-front.jpg' ? 24576 : 32768,
    }));
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(window);
    const objectUrlSpy = vi.fn(() => 'blob:service-request-evidence');
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
            getAttachmentMetadata,
            downloadAttachment: vi.fn().mockResolvedValue(new Blob(['demo'])),
            updateStatus: vi.fn(),
          },
        }}
      >
        <ServiceRequestsPage session={session} />
      </AppClientContext.Provider>,
    );

    expect(await screen.findByText('Meseret Alemu (BUN-100003)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Review request' }));

    expect(await screen.findByText('Phone number update request')).toBeInTheDocument();
    expect(screen.getByText('Requested Phone Number')).toBeInTheDocument();
    expect(screen.getByText('0911000099')).toBeInTheDocument();
    expect((await screen.findAllByText('Image')).length).toBe(2);
    expect(screen.getByText('24 KB')).toBeInTheDocument();
    expect(screen.getByText('32 KB')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Open' })[0]);

    expect(await screen.findByText('Opened evidence fayda-front.jpg.')).toBeInTheDocument();
    expect(objectUrlSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      'blob:service-request-evidence',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
