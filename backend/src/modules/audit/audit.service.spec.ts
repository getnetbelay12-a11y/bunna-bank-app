import { AuditService } from './audit.service';
import { UserRole } from '../../common/enums';
import { Types } from 'mongoose';

describe('AuditService', () => {
  const emptyModel = { find: jest.fn() };
  const configService = {
    get: jest.fn((key: string) =>
      key === 'AUDIT_DIGEST_SECRET' ? 'audit-digest-secret-1234' : undefined,
    ),
  };

  it('creates an audit log record', async () => {
    const id = new Types.ObjectId();
    const model = {
      create: jest.fn().mockImplementation(async (payload) => ({
        _id: id,
        ...payload,
      })),
    };

    const service = new AuditService(
      model as never,
      emptyModel as never,
      emptyModel as never,
      configService as never,
    );
    const result = await service.log({
      actorId: new Types.ObjectId().toString(),
      actorRole: UserRole.ADMIN,
      actionType: 'entity_updated',
      entityType: 'member',
      entityId: new Types.ObjectId().toString(),
      before: { fullName: 'Old' },
      after: { fullName: 'New' },
    });

    expect(model.create).toHaveBeenCalled();
    expect(result.id).toBe(id.toString());
    expect(result.auditDigest).toHaveLength(64);
  });

  it('wraps actor action logging through the common audit path', async () => {
    const actorId = new Types.ObjectId();
    const entityId = new Types.ObjectId();
    const model = {
      create: jest.fn().mockImplementation(async (payload) => ({
        _id: new Types.ObjectId(),
        ...payload,
      })),
    };

    const service = new AuditService(
      model as never,
      emptyModel as never,
      emptyModel as never,
      configService as never,
    );

    await service.logActorAction({
      actorId: actorId.toString(),
      actorRole: UserRole.BRANCH_MANAGER,
      actionType: 'loan_submitted',
      entityType: 'loan',
      entityId: entityId.toString(),
      after: { status: 'submitted' },
    });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId,
        actorRole: UserRole.BRANCH_MANAGER,
        actionType: 'loan_submitted',
        entityType: 'loan',
        entityId,
      }),
    );
  });

  it('versions onboarding review decisions and supersedes the prior current one', async () => {
    const actorId = new Types.ObjectId();
    const entityId = new Types.ObjectId();
    const previousAuditId = new Types.ObjectId();
    const nextAuditId = new Types.ObjectId();
    const model = {
      create: jest.fn().mockImplementation(async (payload) => ({
        _id: nextAuditId,
        ...payload,
      })),
      findOne: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: previousAuditId,
            decisionVersion: 1,
            after: {
              status: 'needs_action',
              note: 'Request correction.',
            },
          }),
        }),
      }),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };

    const service = new AuditService(
      model as never,
      emptyModel as never,
      emptyModel as never,
      configService as never,
    );

    const result = await service.logOnboardingReviewDecision({
      actorId: actorId.toString(),
      actorRole: UserRole.ADMIN,
      entityId: entityId.toString(),
      before: { onboardingReviewStatus: 'review_in_progress' },
      after: { status: 'approved' },
      supersessionReasonCode: 'approval_recorded',
      acknowledgedSupersessionFields: ['status', 'note'],
    });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'onboarding_review_updated',
        entityType: 'member',
        entityId,
        decisionVersion: 2,
        isCurrentDecision: true,
        supersedesAuditId: previousAuditId,
        after: expect.objectContaining({
          status: 'approved',
          supersession: expect.objectContaining({
            reasonCode: 'approval_recorded',
            previousAuditId: previousAuditId.toString(),
            previousDecisionVersion: 1,
            acknowledgedFields: ['status', 'note'],
            changedFields: expect.arrayContaining([
              expect.objectContaining({
                field: 'note',
                previousValue: 'Request correction.',
                nextValue: '',
              }),
              expect.objectContaining({
                field: 'status',
                previousValue: 'needs_action',
                nextValue: 'approved',
              }),
            ]),
          }),
        }),
      }),
    );
    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: previousAuditId },
      expect.objectContaining({
        $set: expect.objectContaining({
          isCurrentDecision: false,
          supersededByAuditId: nextAuditId,
        }),
      }),
    );
    expect(result.decisionVersion).toBe(2);
    expect(result.supersedesAuditId).toBe(previousAuditId.toString());
    expect(result.isCurrentDecision).toBe(true);
  });

  it('rejects superseding onboarding decisions without a reason code', async () => {
    const actorId = new Types.ObjectId();
    const entityId = new Types.ObjectId();
    const model = {
      create: jest.fn(),
      findOne: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: new Types.ObjectId(),
            decisionVersion: 1,
            after: { status: 'needs_action' },
          }),
        }),
      }),
      updateOne: jest.fn(),
    };

    const service = new AuditService(
      model as never,
      emptyModel as never,
      emptyModel as never,
      configService as never,
    );

    await expect(
      service.logOnboardingReviewDecision({
        actorId: actorId.toString(),
        actorRole: UserRole.ADMIN,
        entityId: entityId.toString(),
        after: { status: 'approved' },
      }),
    ).rejects.toThrow(/Supersession reason code is required/);
    expect(model.create).not.toHaveBeenCalled();
  });

  it('rejects superseding onboarding decisions without diff acknowledgments', async () => {
    const actorId = new Types.ObjectId();
    const entityId = new Types.ObjectId();
    const model = {
      create: jest.fn(),
      findOne: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: new Types.ObjectId(),
            decisionVersion: 1,
            after: { status: 'needs_action', note: 'Request correction.' },
          }),
        }),
      }),
      updateOne: jest.fn(),
    };

    const service = new AuditService(
      model as never,
      emptyModel as never,
      emptyModel as never,
      configService as never,
    );

    await expect(
      service.logOnboardingReviewDecision({
        actorId: actorId.toString(),
        actorRole: UserRole.ADMIN,
        entityId: entityId.toString(),
        after: { status: 'approved', note: 'Approved after review.' },
        supersessionReasonCode: 'approval_recorded',
        acknowledgedSupersessionFields: ['status'],
      }),
    ).rejects.toThrow(/Supersession diff must be acknowledged/);
    expect(model.create).not.toHaveBeenCalled();
  });

  it('lists audit logs by query filter', async () => {
    const actorId = new Types.ObjectId();
    const entityId = new Types.ObjectId();
    const model = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: new Types.ObjectId(),
                actorId,
                actorRole: UserRole.ADMIN,
                actionType: 'vote_submitted',
                entityType: 'vote',
                entityId,
                before: null,
                after: null,
              },
            ]),
          }),
        }),
      }),
    };

    const service = new AuditService(
      model as never,
      emptyModel as never,
      emptyModel as never,
      configService as never,
    );
    const result = await service.list({
      actorId: actorId.toString(),
      entityType: 'vote',
      entityId: entityId.toString(),
    });

    expect(model.find).toHaveBeenCalledWith({
      actorId,
      entityType: 'vote',
      entityId,
    });
    expect(result).toHaveLength(1);
  });

  it('verifies an audit digest by recomputing it from stored fields', async () => {
    const actorId = new Types.ObjectId();
    const entityId = new Types.ObjectId();
    const service = new AuditService(
      {
        find: jest.fn(),
        findById: jest.fn(),
      } as never,
      emptyModel as never,
      emptyModel as never,
      configService as never,
    );

    const createdAt = new Date('2026-04-11T12:00:00.000Z');
    const digest = await (service as unknown as { computeAuditDigest: Function }).computeAuditDigest(
      {
        actorId: actorId.toString(),
        actorRole: UserRole.ADMIN,
        actionType: 'onboarding_review_updated',
        entityType: 'member',
        entityId: entityId.toString(),
        before: null,
        after: { status: 'approved' },
      },
      createdAt,
    );

    const model = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          actorId,
          actorRole: UserRole.ADMIN,
          actionType: 'onboarding_review_updated',
          entityType: 'member',
          entityId,
          before: null,
          after: { status: 'approved' },
          auditDigest: digest,
          createdAt,
        }),
      }),
    };

    const verifyingService = new AuditService(
      model as never,
      emptyModel as never,
      emptyModel as never,
      configService as never,
    );
    const result = await verifyingService.verifyAuditLog(new Types.ObjectId().toString());

    expect(result.isValid).toBe(true);
    expect(result.auditDigest).toBe(result.recomputedDigest);
  });

  it('lists onboarding review decisions with focused filters', async () => {
    const actorId = new Types.ObjectId();
    const memberId = new Types.ObjectId();
    const model = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: new Types.ObjectId(),
                actorId,
                actorRole: UserRole.ADMIN,
                actionType: 'onboarding_review_updated',
                entityType: 'member',
                entityId: memberId,
                decisionVersion: 2,
                isCurrentDecision: true,
                before: null,
                after: { status: 'approved', approvalReasonCode: 'official_source_verified' },
              },
            ]),
          }),
        }),
      }),
    };

    const service = new AuditService(
      model as never,
      emptyModel as never,
      emptyModel as never,
      configService as never,
    );
    const result = await service.listOnboardingReviewDecisions({
      actorId: actorId.toString(),
      memberId: memberId.toString(),
      status: 'approved',
      approvalReasonCode: 'official_source_verified',
      dateFrom: '2026-03-01T00:00:00.000Z',
      dateTo: '2026-03-31T23:59:59.999Z',
      currentOnly: 'true',
    });

    expect(model.find).toHaveBeenCalledWith({
      actionType: 'onboarding_review_updated',
      entityType: 'member',
      actorId,
      entityId: memberId,
      'after.status': 'approved',
      'after.approvalReasonCode': 'official_source_verified',
      isCurrentDecision: true,
      createdAt: {
        $gte: new Date('2026-03-01T00:00:00.000Z'),
        $lte: new Date('2026-03-31T23:59:59.999Z'),
      },
    });
    expect(result).toHaveLength(1);
  });

  it('exports onboarding review decisions as csv', async () => {
    const actorId = new Types.ObjectId();
    const memberId = new Types.ObjectId();
    const model = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: new Types.ObjectId(),
                actorId,
                actorRole: UserRole.ADMIN,
                actionType: 'onboarding_review_updated',
                entityType: 'member',
                entityId: memberId,
                before: null,
                after: {
                  status: 'approved',
                  approvalReasonCode: 'official_source_verified',
                  approvalJustification: 'Reviewed and approved.',
                  acknowledgedMismatchFields: ['dateOfBirth'],
                  blockingMismatchFields: ['dateOfBirth'],
                  reviewPolicySnapshot: { policyVersion: 'v1' },
                },
                createdAt: new Date('2026-03-20T10:00:00.000Z'),
              },
            ]),
          }),
        }),
      }),
    };
    const staffModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: actorId,
            identifier: 'staff.admin',
            fullName: 'Admin Reviewer',
            branchId: new Types.ObjectId('507f1f77bcf86cd799439013'),
            districtId: new Types.ObjectId('507f1f77bcf86cd799439014'),
          },
        ]),
      }),
    };
    const memberModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: memberId,
            customerId: 'BUN-100001',
            fullName: 'Abebe Kebede',
            branchId: new Types.ObjectId('507f1f77bcf86cd799439015'),
            districtId: new Types.ObjectId('507f1f77bcf86cd799439016'),
            preferredBranchName: 'Bahir Dar Main Branch',
          },
        ]),
      }),
    };

    const service = new AuditService(
      model as never,
      staffModel as never,
      memberModel as never,
      configService as never,
    );
    const csv = await service.exportOnboardingReviewDecisionsCsv({});

    expect(csv).toContain('"auditId","createdAt","actorId"');
    expect(csv).toContain('"actorIdentifier"');
    expect(csv).toContain('"memberCustomerId"');
    expect(csv).toContain('"Admin Reviewer"');
    expect(csv).toContain('"BUN-100001"');
    expect(csv).toContain('"approved"');
    expect(csv).toContain('"official_source_verified"');
    expect(csv).toContain('"dateOfBirth"');
  });
});
