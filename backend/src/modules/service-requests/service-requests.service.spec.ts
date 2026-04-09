import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { NotificationType, UserRole } from '../../common/enums';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ServiceRequestStatus } from './service-request.types';
import { ServiceRequestsService } from './service-requests.service';

describe('ServiceRequestsService', () => {
  let serviceRequestModel: any;
  let serviceRequestEventModel: any;
  let memberModel: any;
  let auditService: jest.Mocked<AuditService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let service: ServiceRequestsService;

  const memberId = new Types.ObjectId();
  const branchId = new Types.ObjectId();
  const districtId = new Types.ObjectId();

  beforeEach(() => {
    serviceRequestModel = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };
    serviceRequestEventModel = {
      create: jest.fn(),
      find: jest.fn(),
    };
    memberModel = {
      findById: jest.fn(),
    };
    auditService = {
      logActorAction: jest.fn(),
    } as never;
    notificationsService = {
      createNotification: jest.fn(),
    } as never;

    service = new ServiceRequestsService(
      serviceRequestModel,
      serviceRequestEventModel,
      memberModel,
      auditService,
      notificationsService,
    );
  });

  it('creates a service request for a member', async () => {
    const requestId = new Types.ObjectId();
    memberModel.findById.mockResolvedValue({
      _id: memberId,
      customerId: 'BUN-100001',
      fullName: 'Abebe Kebede',
      phone: '0911000001',
      branchId,
      districtId,
      preferredBranchName: 'Bahir Dar Branch',
      isActive: true,
    });
    serviceRequestModel.create.mockResolvedValue({
      _id: requestId,
      id: requestId.toString(),
      memberId,
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      branchId,
      districtId,
      branchName: 'Bahir Dar Branch',
      type: 'failed_transfer',
      title: 'Transfer failed',
      description: 'Transfer did not complete.',
      payload: {},
      attachments: [],
      status: ServiceRequestStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    serviceRequestModel.findById.mockResolvedValue({
      _id: requestId,
      id: requestId.toString(),
      memberId,
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      branchId,
      districtId,
      branchName: 'Bahir Dar Branch',
      type: 'failed_transfer',
      title: 'Transfer failed',
      description: 'Transfer did not complete.',
      payload: {},
      attachments: [],
      status: ServiceRequestStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    serviceRequestEventModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.create(
      {
        sub: memberId.toString(),
        role: UserRole.MEMBER,
        memberId: memberId.toString(),
      },
      {
        type: 'failed_transfer' as never,
        title: 'Transfer failed',
        description: 'Transfer did not complete.',
      },
    );

    expect(result.customerId).toBe('BUN-100001');
    expect(serviceRequestEventModel.create).toHaveBeenCalled();
    expect(auditService.logActorAction).toHaveBeenCalled();
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userType: 'member',
        userId: memberId.toString(),
        type: NotificationType.SERVICE_REQUEST,
        entityType: 'service_request',
        entityId: requestId.toString(),
        actionLabel: 'Open receipts',
        deepLink: '/payments/receipts?filter=disputes',
      }),
    );
  });

  it('keeps non-payment service request notifications pointed at the request timeline', async () => {
    const requestId = new Types.ObjectId();
    memberModel.findById.mockResolvedValue({
      _id: memberId,
      customerId: 'BUN-100001',
      fullName: 'Abebe Kebede',
      phone: '0911000001',
      branchId,
      districtId,
      preferredBranchName: 'Bahir Dar Branch',
      isActive: true,
    });
    serviceRequestModel.create.mockResolvedValue({
      _id: requestId,
      id: requestId.toString(),
      memberId,
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      branchId,
      districtId,
      branchName: 'Bahir Dar Branch',
      type: 'atm_card_request',
      title: 'ATM card request',
      description: 'Need a replacement card.',
      payload: {},
      attachments: [],
      status: ServiceRequestStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    serviceRequestModel.findById.mockResolvedValue({
      _id: requestId,
      id: requestId.toString(),
      memberId,
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      branchId,
      districtId,
      branchName: 'Bahir Dar Branch',
      type: 'atm_card_request',
      title: 'ATM card request',
      description: 'Need a replacement card.',
      payload: {},
      attachments: [],
      status: ServiceRequestStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    serviceRequestEventModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    await service.create(
      {
        sub: memberId.toString(),
        role: UserRole.MEMBER,
        memberId: memberId.toString(),
      },
      {
        type: 'atm_card_request' as never,
        title: 'ATM card request',
        description: 'Need a replacement card.',
      },
    );

    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        actionLabel: 'Open request',
        deepLink: `/service-requests/${requestId.toString()}`,
      }),
    );
  });

  it('lists manager requests within district scope', async () => {
    serviceRequestModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: new Types.ObjectId(),
                memberId,
                customerId: 'BUN-100001',
                memberName: 'Abebe Kebede',
                districtId,
                type: 'payment_dispute',
                title: 'Payment dispute',
                description: 'School payment duplicated.',
                payload: {},
                attachments: [],
                status: ServiceRequestStatus.UNDER_REVIEW,
              },
            ]),
          }),
        }),
      }),
    });
    serviceRequestModel.countDocuments.mockResolvedValue(1);

    const result = await service.listManagerRequests(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.DISTRICT_MANAGER,
        districtId: districtId.toString(),
      },
      {},
    );

    expect(result.total).toBe(1);
    expect(serviceRequestModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ districtId }),
    );
  });

  it('prevents a member from reading another member request', async () => {
    serviceRequestModel.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      memberId: new Types.ObjectId(),
    });

    await expect(
      service.getForActor(
        { sub: memberId.toString(), role: UserRole.MEMBER, memberId: memberId.toString() },
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updates service request status for managers', async () => {
    const requestId = new Types.ObjectId();
    const save = jest.fn();
    serviceRequestModel.findById.mockResolvedValue({
      _id: requestId,
      memberId,
      branchId,
      districtId,
      type: 'failed_transfer',
      title: 'Transfer failed',
      status: ServiceRequestStatus.SUBMITTED,
      save,
    });
    serviceRequestEventModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    serviceRequestModel.findById
      .mockResolvedValueOnce({
        _id: requestId,
        memberId,
        branchId,
        districtId,
        type: 'failed_transfer',
        title: 'Transfer failed',
        status: ServiceRequestStatus.SUBMITTED,
        save,
      })
      .mockResolvedValueOnce({
        _id: requestId,
        memberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        branchId,
        districtId,
        type: 'failed_transfer',
        title: 'Transfer failed',
        description: 'Transfer did not complete.',
        payload: {},
        attachments: [],
        status: ServiceRequestStatus.UNDER_REVIEW,
        assignedToStaffId: new Types.ObjectId(),
        assignedToStaffName: 'Branch Manager',
      });

    const result = await service.updateStatus(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.BRANCH_MANAGER,
        branchId: branchId.toString(),
        fullName: 'Branch Manager',
      },
      requestId.toString(),
      {
        status: ServiceRequestStatus.UNDER_REVIEW,
        note: 'Taking ownership.',
      },
    );

    expect(save).toHaveBeenCalled();
    expect(result.status).toBe(ServiceRequestStatus.UNDER_REVIEW);
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.SERVICE_REQUEST,
        entityType: 'service_request',
        entityId: requestId.toString(),
        title: 'Service Request Under Review',
        actionLabel: 'Open receipts',
        deepLink: '/payments/receipts?filter=disputes',
      }),
    );
  });

  it('raises not found when request is missing', async () => {
    serviceRequestModel.findById.mockResolvedValue(null);

    await expect(
      service.getForActor(
        { sub: memberId.toString(), role: UserRole.ADMIN },
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
