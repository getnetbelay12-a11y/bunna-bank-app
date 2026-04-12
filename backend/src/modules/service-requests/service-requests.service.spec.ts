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
  let securityReviewDailySnapshotModel: any;
  let memberModel: any;
  let staffModel: any;
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
      findOne: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn(),
      countDocuments: jest.fn(),
    };
    serviceRequestEventModel = {
      create: jest.fn(),
      find: jest.fn(),
    };
    securityReviewDailySnapshotModel = {
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    memberModel = {
      findById: jest.fn(),
    };
    staffModel = {
      find: jest.fn(),
    };
    auditService = {
      logActorAction: jest.fn(),
    } as never;
    notificationsService = {
      createNotification: jest.fn(),
      notifyStaffSecurityBreachDigest: jest.fn(),
      notifyStaffSecurityInvestigationStalledDigest: jest.fn(),
    } as never;

    service = new ServiceRequestsService(
      serviceRequestModel,
      serviceRequestEventModel,
      securityReviewDailySnapshotModel,
      memberModel,
      staffModel,
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

  it('returns security review metrics from retained daily event counts instead of inventory totals', async () => {
    const requestId = new Types.ObjectId();
    serviceRequestModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: requestId,
          type: 'security_review',
          status: ServiceRequestStatus.SUBMITTED,
          payload: {
            dueAt: '2026-03-12T10:00:00.000Z',
            slaBreachedAt: '2026-03-12T10:30:00.000Z',
            investigationStalledAt: '2026-03-12T12:00:00.000Z',
            escalatedAt: '2026-03-12T13:00:00.000Z',
          },
        },
      ]),
    });
    serviceRequestEventModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          serviceRequestId: requestId,
          eventType: 'investigation_stalled',
          createdAt: new Date('2026-03-12T12:00:00.000Z'),
        },
        {
          serviceRequestId: requestId,
          eventType: 'stalled_case_escalated',
          createdAt: new Date('2026-03-12T13:00:00.000Z'),
        },
      ]),
    });
    securityReviewDailySnapshotModel.findOneAndUpdate.mockResolvedValue({});
    securityReviewDailySnapshotModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            periodStart: new Date('2026-03-05T00:00:00.000Z'),
            stalledCount: 5,
            takeoverCount: 3,
            stalledEventsCount: 2,
            takeoverEventsCount: 1,
          },
          {
            periodStart: new Date('2026-03-12T00:00:00.000Z'),
            stalledCount: 4,
            takeoverCount: 4,
            stalledEventsCount: 1,
            takeoverEventsCount: 1,
          },
        ]),
      }),
    });

    const realNow = Date.now;
    Date.now = jest.fn(() => new Date('2026-03-13T10:00:00.000Z').getTime());
    try {
      const result = await service.getSecurityReviewMetrics({
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
      });

      expect(result.currentState.openCount).toBe(1);
      expect(result.currentState.stalledCount).toBe(1);
      expect(result.currentState.takeoverCount).toBe(1);
      expect(result.metadata.contractVersion).toBe('security_review_metrics.v2');
      expect(result.metadata.currentStateBasis).toBe('live_service_request_state');
      expect(result.metadata.historyBasis).toBe(
        'retained_daily_aggregates_with_event_fallback',
      );
      expect(result.history.stalledLast7Days).toBe(1);
      expect(result.history.stalledPrevious7Days).toBe(2);
      expect(result.history.takeoversLast7Days).toBe(1);
      expect(result.history.takeoversPrevious7Days).toBe(1);
      expect(securityReviewDailySnapshotModel.findOneAndUpdate).toHaveBeenCalled();
    } finally {
      Date.now = realNow;
    }
  });

  it('materializes recent security review snapshots without waiting for metrics traffic', async () => {
    const requestId = new Types.ObjectId();
    serviceRequestModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: requestId,
          type: 'security_review',
          status: ServiceRequestStatus.SUBMITTED,
          payload: {
            slaBreachedAt: '2026-03-12T10:30:00.000Z',
            investigationStalledAt: '2026-03-12T12:00:00.000Z',
            escalatedAt: '2026-03-12T13:00:00.000Z',
          },
        },
      ]),
    });
    serviceRequestEventModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          serviceRequestId: requestId,
          eventType: 'investigation_stalled',
          createdAt: new Date('2026-03-12T12:00:00.000Z'),
        },
        {
          serviceRequestId: requestId,
          eventType: 'stalled_case_escalated',
          createdAt: new Date('2026-03-12T13:00:00.000Z'),
        },
      ]),
    });
    securityReviewDailySnapshotModel.findOneAndUpdate.mockResolvedValue({});

    const realNow = Date.now;
    Date.now = jest.fn(() => new Date('2026-03-13T10:00:00.000Z').getTime());
    try {
      await service.materializeRecentSecurityReviewSnapshots(3);

      expect(serviceRequestModel.find).toHaveBeenCalledWith({
        type: 'security_review',
      });
      expect(securityReviewDailySnapshotModel.findOneAndUpdate).toHaveBeenCalledTimes(3);
    } finally {
      Date.now = realNow;
    }
  });

  it('audits unsupported security review metrics contract detections', async () => {
    await service.reportSecurityReviewMetricsContractIssue(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
      },
      {
        detectedContractVersion: 'security_review_metrics.v99',
        supportedContractVersion: 'security_review_metrics.v2',
        source: 'head_office_dashboard',
      },
    );

    expect(auditService.logActorAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'unsupported_security_review_metrics_contract_detected',
        entityType: 'staff',
        after: {
          detectedContractVersion: 'security_review_metrics.v99',
          supportedContractVersion: 'security_review_metrics.v2',
          source: 'head_office_dashboard',
        },
      }),
    );
  });

  it('creates a security review request for repeated step-up failures', async () => {
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
    serviceRequestModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
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
      type: 'security_review',
      title: 'Security review',
      description: 'Repeated step-up failures.',
      payload: {},
      attachments: [],
      status: ServiceRequestStatus.SUBMITTED,
      latestNote: 'Flagged from the audit step-up failure watchlist.',
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
      type: 'security_review',
      title: 'Security review',
      description: 'Repeated step-up failures.',
      payload: {},
      attachments: [],
      status: ServiceRequestStatus.SUBMITTED,
      latestNote: 'Flagged from the audit step-up failure watchlist.',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    serviceRequestEventModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.createManagerSecurityReview(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
        fullName: 'Head Office Reviewer',
      },
      {
        memberId: memberId.toString(),
        memberLabel: 'Abebe Kebede',
        reviewerLabel: 'Risk Reviewer',
        failureCount: 3,
        escalationThreshold: 2,
        latestFailureAt: '2026-03-12T10:15:00.000Z',
        reasonCodes: ['invalid_password', 'replayed_or_expired_token'],
        auditIds: ['audit_1', 'audit_2'],
      },
    );

    expect(result.type).toBe('security_review');
    expect(serviceRequestModel.findOne).toHaveBeenCalled();
    expect(auditService.logActorAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'security_review_service_request_created',
      }),
    );
  });

  it('starts investigation metadata when a security review is assigned', async () => {
    const requestId = new Types.ObjectId();
    const save = jest.fn().mockResolvedValue(undefined);
    serviceRequestModel.findById.mockResolvedValue({
      _id: requestId,
      id: requestId.toString(),
      memberId,
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      branchId,
      districtId,
      type: 'security_review',
      status: ServiceRequestStatus.SUBMITTED,
      payload: {},
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
        id: requestId.toString(),
        memberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        branchId,
        districtId,
        type: 'security_review',
        status: ServiceRequestStatus.SUBMITTED,
        payload: {},
        save,
      })
      .mockResolvedValueOnce({
        _id: requestId,
        id: requestId.toString(),
        memberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        branchId,
        districtId,
        type: 'security_review',
        status: ServiceRequestStatus.SUBMITTED,
        payload: {
          investigationStartedAt: '2026-03-12T12:05:00.000Z',
          investigationStartedBy: 'Head Office Reviewer',
        },
      });

    const result = await service.assignToCurrentReviewer(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
        fullName: 'Head Office Reviewer',
      },
      requestId.toString(),
    );

    expect(save).toHaveBeenCalled();
    expect(result.investigationStartedAt).toBeDefined();
    expect(result.investigationStartedBy).toBe('Head Office Reviewer');
  });

  it('acknowledges a breached security review', async () => {
    const requestId = new Types.ObjectId();
    const save = jest.fn().mockResolvedValue(undefined);
    serviceRequestModel.findById
      .mockResolvedValueOnce({
        _id: requestId,
        id: requestId.toString(),
        memberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        branchId,
        districtId,
        type: 'security_review',
        status: ServiceRequestStatus.SUBMITTED,
        payload: {
          slaBreachedAt: '2026-03-12T11:00:00.000Z',
        },
        save,
      })
      .mockResolvedValueOnce({
        _id: requestId,
        id: requestId.toString(),
        memberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        branchId,
        districtId,
        type: 'security_review',
        status: ServiceRequestStatus.SUBMITTED,
        payload: {
          slaBreachedAt: '2026-03-12T11:00:00.000Z',
          breachAcknowledgedAt: '2026-03-12T12:10:00.000Z',
          breachAcknowledgedBy: 'Head Office Reviewer',
        },
      });
    serviceRequestEventModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.acknowledgeSecurityReviewBreach(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
        fullName: 'Head Office Reviewer',
      },
      requestId.toString(),
    );

    expect(save).toHaveBeenCalled();
    expect(result.breachAcknowledgedAt).toBeDefined();
    expect(result.breachAcknowledgedBy).toBe('Head Office Reviewer');
    expect(auditService.logActorAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'security_review_breach_acknowledged',
      }),
    );
  });

  it('marks an acknowledged-but-unstarted investigation as stalled', async () => {
    const requestId = new Types.ObjectId();
    staffModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: new Types.ObjectId(), role: UserRole.HEAD_OFFICE_MANAGER },
          { _id: new Types.ObjectId(), role: UserRole.ADMIN },
        ]),
      }),
    });
    serviceRequestModel.findById.mockResolvedValue({
      _id: requestId,
      id: requestId.toString(),
      memberId,
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      branchId,
      districtId,
      branchName: 'Bahir Dar Branch',
      type: 'security_review',
      title: 'Security review',
      description: 'Repeated step-up failures.',
      payload: {
        slaBreachedAt: '2026-03-12T11:00:00.000Z',
        breachAcknowledgedAt: '2026-03-12T11:30:00.000Z',
      },
      attachments: [],
      status: ServiceRequestStatus.SUBMITTED,
      latestNote: 'Acknowledged',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    serviceRequestModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
    serviceRequestEventModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const realNow = Date.now;
    Date.now = jest.fn(() => new Date('2026-03-12T14:00:00.000Z').getTime());

    try {
      const result = await service.getForActor(
        {
          sub: new Types.ObjectId().toString(),
          role: UserRole.HEAD_OFFICE_MANAGER,
        },
        requestId.toString(),
      );

      expect(result.followUpState).toBe('investigation_stalled');
      expect(result.investigationStalledAt).toBeDefined();
      expect(serviceRequestEventModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'investigation_stalled',
        }),
      );
      expect(auditService.logActorAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'security_review_investigation_stalled',
        }),
      );
      expect(
        notificationsService.notifyStaffSecurityInvestigationStalledDigest,
      ).toHaveBeenCalledTimes(2);
    } finally {
      Date.now = realNow;
    }
  });

  it('allows higher authority to take over a stalled security review', async () => {
    const requestId = new Types.ObjectId();
    const save = jest.fn().mockResolvedValue(undefined);
    serviceRequestModel.findById
      .mockResolvedValueOnce({
        _id: requestId,
        id: requestId.toString(),
        memberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        branchId,
        districtId,
        type: 'security_review',
        status: ServiceRequestStatus.SUBMITTED,
        assignedToStaffId: new Types.ObjectId(),
        assignedToStaffName: 'Old Reviewer',
        payload: {
          slaBreachedAt: '2026-03-12T11:00:00.000Z',
          breachAcknowledgedAt: '2026-03-12T11:30:00.000Z',
          investigationStalledAt: '2026-03-12T14:00:00.000Z',
        },
        save,
      })
      .mockResolvedValueOnce({
        _id: requestId,
        id: requestId.toString(),
        memberId,
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        branchId,
        districtId,
        type: 'security_review',
        status: ServiceRequestStatus.SUBMITTED,
        assignedToStaffName: 'Head Office Manager',
        payload: {
          slaBreachedAt: '2026-03-12T11:00:00.000Z',
          breachAcknowledgedAt: '2026-03-12T11:30:00.000Z',
          investigationStalledAt: '2026-03-12T14:00:00.000Z',
          escalatedAt: '2026-03-12T14:20:00.000Z',
          escalatedBy: 'Head Office Manager',
          investigationStartedAt: '2026-03-12T14:20:00.000Z',
          investigationStartedBy: 'Head Office Manager',
        },
      });
    serviceRequestEventModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.escalateStalledSecurityReview(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
        fullName: 'Head Office Manager',
      },
      requestId.toString(),
    );

    expect(save).toHaveBeenCalled();
    expect(result.assignedToStaffName).toBe('Head Office Manager');
    expect(result.escalatedAt).toBeDefined();
    expect(result.followUpState).toBe('investigation_started');
    expect(auditService.logActorAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'security_review_stalled_case_escalated',
      }),
    );
    expect(serviceRequestEventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'stalled_case_escalated',
      }),
    );
  });

  it('records a security review SLA breach once when an overdue case is read', async () => {
    const requestId = new Types.ObjectId();
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
      type: 'security_review',
      title: 'Security review',
      description: 'Repeated step-up failures.',
      payload: {
        dueAt: '2020-03-12T10:15:00.000Z',
      },
      attachments: [],
      status: ServiceRequestStatus.SUBMITTED,
      latestNote: 'Initial note',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    serviceRequestModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
    staffModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: new Types.ObjectId(), role: UserRole.HEAD_OFFICE_MANAGER },
          { _id: new Types.ObjectId(), role: UserRole.HEAD_OFFICE_OFFICER },
        ]),
      }),
    });
    serviceRequestEventModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.getForActor(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
      },
      requestId.toString(),
    );

    expect(result.slaState).toBe('overdue');
    expect(result.slaBreachedAt).toBeDefined();
    expect(serviceRequestModel.updateOne).toHaveBeenCalled();
    expect(serviceRequestEventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'sla_breached',
      }),
    );
    expect(auditService.logActorAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'security_review_sla_breached',
      }),
    );
    expect(notificationsService.notifyStaffSecurityBreachDigest).toHaveBeenCalledTimes(2);
    expect(notificationsService.notifyStaffSecurityBreachDigest).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceRequestId: requestId.toString(),
      }),
    );
  });

  it('blocks duplicate open security review requests for the same member', async () => {
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
    serviceRequestModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
      }),
    });

    await expect(
      service.createManagerSecurityReview(
        {
          sub: new Types.ObjectId().toString(),
          role: UserRole.HEAD_OFFICE_MANAGER,
          fullName: 'Head Office Reviewer',
        },
        {
          memberId: memberId.toString(),
          memberLabel: 'Abebe Kebede',
          reviewerLabel: 'Risk Reviewer',
          failureCount: 3,
          escalationThreshold: 2,
          latestFailureAt: '2026-03-12T10:15:00.000Z',
        },
      ),
    ).rejects.toThrow('An active security review already exists');
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
