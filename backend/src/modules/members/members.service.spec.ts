import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { MemberType, UserRole } from '../../common/enums';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/interfaces';
import { MemberProfilesService } from '../member-profiles/member-profiles.service';
import { CreateMemberDto, ListMembersQueryDto } from './dto';
import { MemberListResult } from './interfaces';
import { MemberProfile } from './interfaces';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';

describe('MembersService', () => {
  let membersRepository: jest.Mocked<MembersRepository>;
  let auditService: jest.Mocked<AuditService>;
  let memberProfilesService: jest.Mocked<MemberProfilesService>;
  let service: MembersService;

  const memberProfile: MemberProfile = {
    id: 'member_1',
    memberNumber: 'MBR-10001',
    memberType: MemberType.SHAREHOLDER,
    role: UserRole.SHAREHOLDER_MEMBER,
    fullName: 'Abebe Kebede',
    phone: '+251911223344',
    email: 'abebe@example.com',
    branchId: 'branch_01',
    branchName: 'Bahir Dar Branch',
    districtId: 'district_01',
    districtName: 'Bahir Dar District',
    shareBalance: 250000,
    isActive: true,
  };

  beforeEach(() => {
    membersRepository = {
      findById: jest.fn(),
      updateById: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
    } as unknown as jest.Mocked<MembersRepository>;
    auditService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;
    memberProfilesService = {
      findByMemberId: jest.fn().mockResolvedValue({
        membershipStatus: 'pending_verification',
        identityVerificationStatus: 'not_started',
      }),
    } as unknown as jest.Mocked<MemberProfilesService>;

    service = new MembersService(
      membersRepository,
      auditService,
      memberProfilesService,
    );
  });

  it('returns the current member profile for a shareholder member', async () => {
    membersRepository.findById.mockResolvedValue(memberProfile);

    const currentUser: AuthenticatedUser = {
      sub: 'member_1',
      role: UserRole.SHAREHOLDER_MEMBER,
      memberType: MemberType.SHAREHOLDER,
    };

    await expect(service.getMyProfile(currentUser)).resolves.toEqual({
      ...memberProfile,
      membershipStatus: 'pending_verification',
      identityVerificationStatus: 'not_started',
    });
  });

  it('rejects staff users from member self-service endpoints', async () => {
    const currentUser: AuthenticatedUser = {
      sub: 'staff_1',
      role: UserRole.BRANCH_MANAGER,
    };

    await expect(service.getMyProfile(currentUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('updates the current member profile', async () => {
    const updatedProfile: MemberProfile = {
      ...memberProfile,
      fullName: 'Abebe K.',
    };

    membersRepository.findById.mockResolvedValue(memberProfile);
    membersRepository.updateById.mockResolvedValue(updatedProfile);

    const currentUser: AuthenticatedUser = {
      sub: 'member_1',
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
    };

    await expect(
      service.updateMyProfile(currentUser, { fullName: 'Abebe K.' }),
    ).resolves.toEqual({
      ...updatedProfile,
      membershipStatus: 'pending_verification',
      identityVerificationStatus: 'not_started',
    });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'member_profile_updated',
        entityType: 'member',
      }),
    );
  });

  it('allows staff to fetch a member by id', async () => {
    membersRepository.findById.mockResolvedValue(memberProfile);

    const currentUser: AuthenticatedUser = {
      sub: 'staff_1',
      role: UserRole.LOAN_OFFICER,
    };

    await expect(service.getMemberById(currentUser, 'member_1')).resolves.toEqual(
      memberProfile,
    );
  });

  it('raises not found when the member record is missing', async () => {
    membersRepository.findById.mockResolvedValue(null);

    const currentUser: AuthenticatedUser = {
      sub: 'staff_1',
      role: UserRole.ADMIN,
    };

    await expect(service.getMemberById(currentUser, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a member through a staff/admin user', async () => {
    const currentUser: AuthenticatedUser = {
      sub: 'staff_1',
      role: UserRole.ADMIN,
    };
    const dto: CreateMemberDto = {
      memberNumber: 'MBR-10003',
      memberType: MemberType.MEMBER,
      role: UserRole.MEMBER,
      fullName: 'New Member',
      phone: '+251911111111',
      email: 'member3@example.com',
      branchId: '67c000000000000000000001',
      districtId: '67c000000000000000000002',
      shareBalance: 0,
      password: 'secret123',
    };

    membersRepository.create.mockResolvedValue({
      ...memberProfile,
      id: 'member_3',
      memberNumber: dto.memberNumber,
      memberType: dto.memberType,
      role: dto.role,
      fullName: dto.fullName,
      phone: dto.phone,
    });

    const result = await service.createMember(currentUser, dto);

    expect(result.memberNumber).toBe(dto.memberNumber);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'member_created',
        entityType: 'member',
        entityId: 'member_3',
      }),
    );
  });

  it('lists members for staff users', async () => {
    const currentUser: AuthenticatedUser = {
      sub: 'staff_1',
      role: UserRole.BRANCH_MANAGER,
    };
    const query: ListMembersQueryDto = {
      page: 1,
      limit: 20,
      memberType: MemberType.SHAREHOLDER,
    };
    const result: MemberListResult = {
      items: [memberProfile],
      total: 1,
      page: 1,
      limit: 20,
    };

    membersRepository.list.mockResolvedValue(result);

    await expect(service.listMembers(currentUser, query)).resolves.toEqual(result);
  });
});
