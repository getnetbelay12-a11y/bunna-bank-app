import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { MemberType, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { ShareholdersService } from './shareholders.service';

describe('ShareholdersService', () => {
  let memberModel: { findOne: jest.Mock };
  let service: ShareholdersService;

  beforeEach(() => {
    memberModel = {
      findOne: jest.fn(),
    };

    service = new ShareholdersService(memberModel as never);
  });

  it('returns the current shareholder profile', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.SHAREHOLDER_MEMBER,
      memberType: MemberType.SHAREHOLDER,
    };
    const shareholder = {
      _id: currentUser.sub,
      memberType: MemberType.SHAREHOLDER,
      role: UserRole.SHAREHOLDER_MEMBER,
      shareBalance: 5000,
      isActive: true,
    };

    memberModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(shareholder),
      }),
    });

    await expect(service.getMyShareholderProfile(currentUser)).resolves.toEqual(
      shareholder,
    );
  });

  it('builds positive voting eligibility for an active shareholder', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.SHAREHOLDER_MEMBER,
      memberType: MemberType.SHAREHOLDER,
    };

    memberModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: currentUser.sub,
          memberType: MemberType.SHAREHOLDER,
          role: UserRole.SHAREHOLDER_MEMBER,
          shareBalance: 250000,
          isActive: true,
        }),
      }),
    });

    await expect(service.getMyVotingEligibility(currentUser)).resolves.toEqual(
      expect.objectContaining({
        memberId: currentUser.sub,
        canVote: true,
        isShareholder: true,
      }),
    );
  });

  it('rejects regular members from shareholder endpoints', async () => {
    await expect(
      service.getMyVotingEligibility({
        sub: 'member_1',
        role: UserRole.MEMBER,
        memberType: MemberType.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns ineligible status for inactive shareholder account', async () => {
    const memberId = new Types.ObjectId().toString();

    memberModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: memberId,
          memberType: MemberType.SHAREHOLDER,
          role: UserRole.SHAREHOLDER_MEMBER,
          shareBalance: 1000,
          isActive: false,
        }),
      }),
    });

    await expect(
      service.getVotingEligibilityByMemberId(
        {
          sub: 'staff_1',
          role: UserRole.ADMIN,
        },
        memberId,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        canVote: false,
        reason: 'Shareholder account is inactive.',
      }),
    );
  });

  it('throws when the shareholder record does not exist', async () => {
    memberModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.getShareholderById(
        {
          sub: 'staff_1',
          role: UserRole.BRANCH_MANAGER,
        },
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
