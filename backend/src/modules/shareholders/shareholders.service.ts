import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MemberType, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import {
  ShareholderEligibility,
  ShareholderProfile,
} from './interfaces';

@Injectable()
export class ShareholdersService {
  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
  ) {}

  async getMyShareholderProfile(
    currentUser: AuthenticatedUser,
  ): Promise<ShareholderProfile> {
    this.ensureShareholderPrincipal(currentUser);

    const member = await this.findShareholderById(currentUser.sub);

    if (!member) {
      throw new NotFoundException('Shareholder not found.');
    }

    return this.toShareholderProfile(member);
  }

  async getMyVotingEligibility(
    currentUser: AuthenticatedUser,
  ): Promise<ShareholderEligibility> {
    this.ensureShareholderPrincipal(currentUser);

    const member = await this.findShareholderById(currentUser.sub);

    if (!member) {
      throw new NotFoundException('Shareholder not found.');
    }

    return this.buildEligibility(member);
  }

  async getShareholderById(
    currentUser: AuthenticatedUser,
    memberId: string,
  ): Promise<ShareholderProfile> {
    this.ensureStaffAccess(currentUser);

    const member = await this.findShareholderById(memberId);

    if (!member) {
      throw new NotFoundException('Shareholder not found.');
    }

    return this.toShareholderProfile(member);
  }

  async getVotingEligibilityByMemberId(
    currentUser: AuthenticatedUser,
    memberId: string,
  ): Promise<ShareholderEligibility> {
    this.ensureStaffAccess(currentUser);

    const member = await this.findShareholderById(memberId);

    if (!member) {
      throw new NotFoundException('Shareholder not found.');
    }

    return this.buildEligibility(member);
  }

  private findShareholderById(
    memberId: string,
  ): Promise<ShareholderProfile | null> {
    return this.memberModel
      .findOne({
        _id: memberId,
        memberType: MemberType.SHAREHOLDER,
        role: UserRole.SHAREHOLDER_MEMBER,
      })
      .lean<ShareholderProfile | null>()
      .exec();
  }

  private buildEligibility(
    member: ShareholderProfile,
  ): ShareholderEligibility {
    const isShareholder =
      member.memberType === MemberType.SHAREHOLDER &&
      member.role === UserRole.SHAREHOLDER_MEMBER;
    const canVote = isShareholder && member.isActive && member.shareBalance > 0;

    let reason = 'Eligible for annual shareholder voting.';

    if (!isShareholder) {
      reason = 'Member is not registered as a shareholder.';
    } else if (!member.isActive) {
      reason = 'Shareholder account is inactive.';
    } else if (member.shareBalance <= 0) {
      reason = 'Shareholder has no voting-eligible share balance.';
    }

    return {
      memberId: member._id,
      isShareholder,
      canVote,
      isActive: member.isActive,
      shareBalance: member.shareBalance,
      reason,
    };
  }

  private ensureShareholderPrincipal(currentUser: AuthenticatedUser): void {
    if (currentUser.role !== UserRole.SHAREHOLDER_MEMBER) {
      throw new ForbiddenException(
        'Only shareholder members can access this resource.',
      );
    }
  }

  private ensureStaffAccess(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role === UserRole.MEMBER ||
      currentUser.role === UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only staff users can access this resource.');
    }
  }

  private toShareholderProfile(member: ShareholderProfile): ShareholderProfile {
    return {
      ...member,
      shareholderId: member.shareholderId ?? member.memberNumber,
      shares: member.shares ?? member.shareBalance,
      shareBalance: member.shareBalance ?? member.shares ?? 0,
    };
  }
}
