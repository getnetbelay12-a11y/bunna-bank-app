import { createHash } from 'crypto';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { MemberType, UserRole } from '../../common/enums';
import {
  MEMBER_AUTH_REPOSITORY,
  STAFF_AUTH_REPOSITORY,
} from './auth.constants';
import { AuthService } from './auth.service';
import { MemberAuthRepository, StaffAuthRepository } from './auth.types';
import { MemberProfilesService } from '../member-profiles/member-profiles.service';

describe('AuthService', () => {
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let memberRepository: jest.Mocked<MemberAuthRepository>;
  let staffRepository: jest.Mocked<StaffAuthRepository>;
  let memberProfilesService: jest.Mocked<MemberProfilesService>;
  let service: AuthService;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue({
        accessTokenExpiresIn: '1d',
        refreshTokenExpiresIn: '7d',
        jwtIssuer: 'cbe-bank-api',
        jwtAudience: 'cbe-bank-clients',
      }),
    } as unknown as jest.Mocked<ConfigService>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token'),
    } as unknown as jest.Mocked<JwtService>;

    memberRepository = {
      findByCustomerId: jest.fn(),
    };

    staffRepository = {
      findByIdentifier: jest.fn(),
    } as jest.Mocked<StaffAuthRepository>;
    memberProfilesService = {
      findByMemberId: jest.fn().mockResolvedValue({
        membershipStatus: 'pending_verification',
        identityVerificationStatus: 'not_started',
      }),
    } as unknown as jest.Mocked<MemberProfilesService>;

    service = new AuthService(
      configService,
      jwtService,
      memberRepository,
      staffRepository,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      memberProfilesService,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('logs in a member and returns JWT tokens', async () => {
    memberRepository.findByCustomerId.mockResolvedValue({
      id: 'member_1',
      customerId: 'MBR-10001',
      role: UserRole.SHAREHOLDER_MEMBER,
      memberType: MemberType.SHAREHOLDER,
      fullName: 'Abebe Kebede',
      memberNumber: 'MBR-10001',
      passwordHash: 'secret123',
      phone: '+251911223344',
      branchId: 'branch_01',
      districtId: 'district_01',
      branchName: 'Bahir Dar Branch',
      districtName: 'Bahir Dar District',
    });

    const result = await service.loginMember({
      customerId: 'MBR-10001',
      password: 'secret123',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'member_1',
        role: UserRole.SHAREHOLDER_MEMBER,
        customerId: 'MBR-10001',
        memberType: MemberType.SHAREHOLDER,
        fullName: 'Abebe Kebede',
        memberNumber: 'MBR-10001',
        staffNumber: undefined,
        branchId: 'branch_01',
        districtId: 'district_01',
        branchName: 'Bahir Dar Branch',
        districtName: 'Bahir Dar District',
        phone: '+251911223344',
        membershipStatus: 'pending_verification',
        identityVerificationStatus: 'not_started',
        featureFlags: {
          voting: true,
          schoolPayment: true,
          loans: true,
          savings: true,
          liveChat: true,
        },
      },
    });
  });

  it('rejects invalid member credentials', async () => {
    memberRepository.findByCustomerId.mockResolvedValue({
      id: 'member_1',
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
      passwordHash: 'correct-password',
    });

    await expect(
      service.loginMember({
        customerId: 'MBR-10002',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects staff users on the member login endpoint', async () => {
    memberRepository.findByCustomerId.mockResolvedValue({
      id: 'staff_1',
      role: UserRole.LOAN_OFFICER,
      passwordHash: 'secret123',
    });

    await expect(
      service.loginMember({
        customerId: 'MBR-10003',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('logs in a staff user through the staff endpoint', async () => {
    jwtService.signAsync = jest
      .fn()
      .mockResolvedValueOnce('staff-access-token')
      .mockResolvedValueOnce('staff-refresh-token');

    staffRepository.findByIdentifier.mockResolvedValue({
      id: 'staff_2',
      role: UserRole.BRANCH_MANAGER,
      customerId: undefined,
      fullName: 'Selamawit Assefa',
      staffNumber: 'STF-2001',
      passwordHash: 'admin-secret',
      branchId: 'branch_05',
      districtId: 'district_02',
      branchName: 'Gondar Branch',
      districtName: 'Gondar District',
    });

    const result = await service.loginStaff({
      identifier: 'branch.manager',
      password: 'admin-secret',
    });

    expect(result.user).toEqual({
      id: 'staff_2',
      role: UserRole.BRANCH_MANAGER,
      customerId: undefined,
      memberType: undefined,
      fullName: 'Selamawit Assefa',
      memberNumber: undefined,
      staffNumber: 'STF-2001',
      branchId: 'branch_05',
      districtId: 'district_02',
      branchName: 'Gondar Branch',
      districtName: 'Gondar District',
      phone: undefined,
      membershipStatus: undefined,
      identityVerificationStatus: undefined,
      featureFlags: undefined,
    });
    expect(result.accessToken).toBe('staff-access-token');
    expect(result.refreshToken).toBe('staff-refresh-token');
  });

  it('accepts a hashed head office password and returns head office scope', async () => {
    jwtService.signAsync = jest
      .fn()
      .mockResolvedValueOnce('staff-access-token')
      .mockResolvedValueOnce('staff-refresh-token');

    staffRepository.findByIdentifier.mockResolvedValue({
      id: 'staff_3',
      role: UserRole.HEAD_OFFICE_MANAGER,
      fullName: 'Aster Mengistu',
      staffNumber: 'STF-2007',
      passwordHash: createHash('sha256').update('Bunna123!').digest('hex'),
    });

    const result = await service.loginStaff({
      identifier: 'admin@bunna.local',
      password: 'Bunna123!',
    });

    expect(result.user).toEqual({
      id: 'staff_3',
      role: UserRole.HEAD_OFFICE_MANAGER,
      customerId: undefined,
      memberType: undefined,
      fullName: 'Aster Mengistu',
      memberNumber: undefined,
      staffNumber: 'STF-2007',
      branchId: undefined,
      districtId: undefined,
      branchName: 'Head Office',
      districtName: undefined,
      phone: undefined,
      membershipStatus: undefined,
      identityVerificationStatus: undefined,
      featureFlags: undefined,
    });
  });
});
