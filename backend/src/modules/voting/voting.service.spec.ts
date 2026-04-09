import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { MemberType, UserRole, VoteStatus } from '../../common/enums';
import { VotingService } from './voting.service';

describe('VotingService', () => {
  let voteModel: {
    findById: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };
  let voteOptionModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    insertMany: jest.Mock;
    countDocuments: jest.Mock;
  };
  let voteResponseModel: { find: jest.Mock; findOne: jest.Mock; create: jest.Mock; aggregate: jest.Mock };
  let voteAuditLogModel: { create: jest.Mock };
  let memberModel: { findById: jest.Mock; countDocuments: jest.Mock };
  let branchModel: { find: jest.Mock };
  let districtModel: { find: jest.Mock };
  let notificationsService: { createNotification: jest.Mock };
  let securityModel: { findOne: jest.Mock };
  let voteOtpPort: { verify: jest.Mock };
  let auditService: { logActorAction: jest.Mock };
  let service: VotingService;

  beforeEach(() => {
    voteModel = {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    voteOptionModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      insertMany: jest.fn(),
      countDocuments: jest.fn(),
    };
    voteResponseModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    };
    voteAuditLogModel = { create: jest.fn() };
    memberModel = { findById: jest.fn(), countDocuments: jest.fn() };
    branchModel = { find: jest.fn() };
    districtModel = { find: jest.fn() };
    notificationsService = { createNotification: jest.fn() };
    securityModel = { findOne: jest.fn() };
    voteOtpPort = { verify: jest.fn() };
    auditService = { logActorAction: jest.fn() };

    service = new VotingService(
      voteModel as never,
      voteOptionModel as never,
      voteResponseModel as never,
      voteAuditLogModel as never,
      memberModel as never,
      branchModel as never,
      districtModel as never,
      securityModel as never,
      voteOtpPort,
      auditService as never,
      notificationsService as never,
    );
  });

  const voteId = new Types.ObjectId();
  const optionId = new Types.ObjectId();
  const memberId = new Types.ObjectId();

  const openVote = {
    _id: voteId,
    title: 'Board Election 2026',
    status: VoteStatus.OPEN,
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-12-31T23:59:59.000Z'),
  };

  it('records a vote for an eligible shareholder', async () => {
    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: memberId,
        memberType: MemberType.SHAREHOLDER,
        isActive: true,
        kycStatus: 'verified',
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
      }),
    });
    voteModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(openVote),
    });
    voteOptionModel.findOne.mockResolvedValue({
      _id: optionId,
      voteId,
      name: 'Candidate A',
    });
    securityModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    voteResponseModel.findOne.mockResolvedValue(null);
    voteOtpPort.verify.mockResolvedValue(new Date('2026-05-03T09:30:00.000Z'));
    voteResponseModel.create.mockResolvedValue({ _id: new Types.ObjectId() });

    const result = await service.respondToVote(
      {
        sub: memberId.toString(),
        role: UserRole.SHAREHOLDER_MEMBER,
        memberType: MemberType.SHAREHOLDER,
      },
      voteId.toString(),
      {
        optionId: optionId.toString(),
        encryptedBallot: 'ciphertext',
        otpCode: '123456',
      },
    );

    expect(voteOtpPort.verify).toHaveBeenCalledWith(memberId.toString(), '123456');
    expect(voteResponseModel.create).toHaveBeenCalled();
    expect(voteAuditLogModel.create).toHaveBeenCalled();
    expect(notificationsService.createNotification).toHaveBeenCalled();
    expect(auditService.logActorAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'vote_submitted',
        entityType: 'vote',
      }),
    );
    expect(result.optionId).toBe(optionId.toString());
  });

  it('rejects regular members', async () => {
    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: memberId,
        memberType: MemberType.MEMBER,
        isActive: true,
        kycStatus: 'verified',
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
      }),
    });
    voteModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(openVote),
    });

    await expect(
      service.respondToVote(
        {
          sub: memberId.toString(),
          role: UserRole.MEMBER,
          memberType: MemberType.MEMBER,
        },
        voteId.toString(),
        {
          optionId: optionId.toString(),
          encryptedBallot: 'ciphertext',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate vote submissions', async () => {
    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: memberId,
        memberType: MemberType.SHAREHOLDER,
        isActive: true,
        kycStatus: 'verified',
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
      }),
    });
    voteModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(openVote),
    });
    voteOptionModel.findOne.mockResolvedValue({
      _id: optionId,
      voteId,
      name: 'Candidate A',
    });
    securityModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    voteResponseModel.findOne.mockResolvedValue({ _id: new Types.ObjectId() });

    await expect(
      service.respondToVote(
        {
          sub: memberId.toString(),
          role: UserRole.SHAREHOLDER_MEMBER,
          memberType: MemberType.SHAREHOLDER,
        },
        voteId.toString(),
        {
          optionId: optionId.toString(),
          encryptedBallot: 'ciphertext',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid option selections', async () => {
    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: memberId,
        memberType: MemberType.SHAREHOLDER,
        isActive: true,
        kycStatus: 'verified',
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
      }),
    });
    voteModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(openVote),
    });
    voteOptionModel.findOne.mockResolvedValue(null);
    securityModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    voteResponseModel.findOne.mockResolvedValue(null);

    await expect(
      service.respondToVote(
        {
          sub: memberId.toString(),
          role: UserRole.SHAREHOLDER_MEMBER,
          memberType: MemberType.SHAREHOLDER,
        },
        voteId.toString(),
        {
          optionId: optionId.toString(),
          encryptedBallot: 'ciphertext',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects closed votes', async () => {
    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: memberId,
        memberType: MemberType.SHAREHOLDER,
        isActive: true,
        kycStatus: 'verified',
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
      }),
    });
    voteModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        ...openVote,
        status: VoteStatus.CLOSED,
      }),
    });

    await expect(
      service.respondToVote(
        {
          sub: memberId.toString(),
          role: UserRole.SHAREHOLDER_MEMBER,
          memberType: MemberType.SHAREHOLDER,
        },
        voteId.toString(),
        {
          optionId: optionId.toString(),
          encryptedBallot: 'ciphertext',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects voting when account lock is enabled', async () => {
    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: memberId,
        memberType: MemberType.SHAREHOLDER,
        isActive: true,
        kycStatus: 'verified',
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
      }),
    });
    voteModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(openVote),
    });
    voteOptionModel.findOne.mockResolvedValue({
      _id: optionId,
      voteId,
      name: 'Candidate A',
    });
    voteResponseModel.findOne.mockResolvedValue(null);
    securityModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ accountLockEnabled: true }),
    });

    await expect(
      service.respondToVote(
        {
          sub: memberId.toString(),
          role: UserRole.SHAREHOLDER_MEMBER,
          memberType: MemberType.SHAREHOLDER,
        },
        voteId.toString(),
        {
          optionId: optionId.toString(),
          encryptedBallot: 'ciphertext',
          otpCode: '123456',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists admin votes with participation totals', async () => {
    memberModel.countDocuments.mockResolvedValue(1000);
    voteModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([openVote]),
      }),
    });
    voteResponseModel.aggregate.mockResolvedValue([
      { _id: voteId, totalResponses: 430 },
    ]);

    await expect(
      service.listVotesForAdmin({
        sub: 'staff_1',
        role: UserRole.ADMIN,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: voteId.toString(),
        totalResponses: 430,
        participationRate: 43,
      }),
    ]);
  });
});
