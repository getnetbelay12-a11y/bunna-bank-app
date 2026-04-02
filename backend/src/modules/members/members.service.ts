import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRole } from '../../common/enums';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/interfaces';
import { MemberProfilesService } from '../member-profiles/member-profiles.service';
import { CreateMemberDto, ListMembersQueryDto, UpdateMyProfileDto } from './dto';
import { MemberListResult, MemberProfile } from './interfaces';
import { MembersRepository } from './members.repository';

@Injectable()
export class MembersService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly auditService: AuditService,
    private readonly memberProfilesService: MemberProfilesService,
  ) {}

  async getMyProfile(currentUser: AuthenticatedUser): Promise<MemberProfile> {
    this.ensureMemberPrincipal(currentUser);

    const member = await this.membersRepository.findById(currentUser.sub);

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const profile = await this.memberProfilesService.findByMemberId(currentUser.sub);

    return {
      ...member,
      membershipStatus: profile?.membershipStatus ?? 'pending_verification',
      identityVerificationStatus:
        profile?.identityVerificationStatus ?? 'not_started',
    };
  }

  async updateMyProfile(
    currentUser: AuthenticatedUser,
    dto: UpdateMyProfileDto,
  ): Promise<MemberProfile> {
    this.ensureMemberPrincipal(currentUser);

    const before = await this.membersRepository.findById(currentUser.sub);

    if (!before) {
      throw new NotFoundException('Member not found.');
    }

    const updated = await this.membersRepository.updateById(currentUser.sub, dto);

    await this.auditService.log({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'member_profile_updated',
      entityType: 'member',
      entityId: currentUser.sub,
      before: {
        fullName: before.fullName,
        email: before.email,
        phone: before.phone,
      },
      after: {
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
      },
    });

    const profile = await this.memberProfilesService.findByMemberId(currentUser.sub);

    return {
      ...updated,
      membershipStatus: profile?.membershipStatus ?? 'pending_verification',
      identityVerificationStatus:
        profile?.identityVerificationStatus ?? 'not_started',
    };
  }

  async getMemberById(
    currentUser: AuthenticatedUser,
    memberId: string,
  ): Promise<MemberProfile> {
    this.ensureStaffAccess(currentUser);

    const member = await this.membersRepository.findById(memberId);

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    return member;
  }

  async createMember(
    currentUser: AuthenticatedUser,
    dto: CreateMemberDto,
  ): Promise<MemberProfile> {
    this.ensureStaffAccess(currentUser);

    const allowedRoles = new Set([UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER]);
    if (!allowedRoles.has(dto.role)) {
      throw new ConflictException('Members can only be created with member roles.');
    }

    const created = await this.membersRepository.create(dto);

    await this.auditService.log({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'member_created',
      entityType: 'member',
      entityId: created.id,
      before: null,
      after: {
        memberNumber: created.memberNumber,
        memberType: created.memberType,
        role: created.role,
        branchId: created.branchId,
        districtId: created.districtId,
      },
    });

    return created;
  }

  async listMembers(
    currentUser: AuthenticatedUser,
    query: ListMembersQueryDto,
  ): Promise<MemberListResult> {
    this.ensureStaffAccess(currentUser);
    return this.membersRepository.list(query);
  }

  private ensureMemberPrincipal(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role !== UserRole.MEMBER &&
      currentUser.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only members can access this resource.');
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
}
