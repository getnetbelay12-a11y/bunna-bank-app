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

describe('AuthService', () => {
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let memberRepository: jest.Mocked<MemberAuthRepository>;
  let staffRepository: jest.Mocked<StaffAuthRepository>;
  let notificationsService: {
    createNotification: jest.Mock;
  };
  let service: AuthService;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue({
        accessTokenExpiresIn: '1d',
        refreshTokenExpiresIn: '7d',
        jwtIssuer: 'bunna-bank-api',
        jwtAudience: 'bunna-bank-clients',
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
    };

    notificationsService = {
      createNotification: jest.fn(),
    };

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
      {
        findByMemberId: jest.fn().mockResolvedValue({
          membershipStatus: 'active',
          identityVerificationStatus: 'verified',
        }),
        updateStatuses: jest.fn(),
        create: jest.fn(),
      } as never,
      {} as never,
      notificationsService as never,
      {
        sendTemplated: jest.fn(),
      } as never,
      {
        sendOtp: jest.fn(),
      } as never,
      {
        log: jest.fn(),
      } as never,
    );
  });

  it('logs in a member and returns JWT tokens', async () => {
    memberRepository.findByCustomerId.mockResolvedValue({
      id: 'member_1',
      customerId: 'BUN-100001',
      role: UserRole.SHAREHOLDER_MEMBER,
      memberType: MemberType.SHAREHOLDER,
      fullName: 'Abebe Kebede',
      memberNumber: 'BUN-100001',
      passwordHash: 'secret123',
      phone: '+251911223344',
      branchId: 'branch_01',
      districtId: 'district_01',
      branchName: 'Bahir Dar Branch',
      districtName: 'Bahir Dar District',
    });

    const result = await service.loginMember({
      customerId: 'BUN-100001',
      password: 'secret123',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'member_1',
        role: UserRole.SHAREHOLDER_MEMBER,
        identifier: undefined,
        email: undefined,
        customerId: 'BUN-100001',
        memberType: MemberType.SHAREHOLDER,
        fullName: 'Abebe Kebede',
        memberNumber: 'BUN-100001',
        phone: '+251911223344',
        staffNumber: undefined,
        branchId: 'branch_01',
        districtId: 'district_01',
        branchName: 'Bahir Dar Branch',
        districtName: 'Bahir Dar District',
        permissions: undefined,
        membershipStatus: 'active',
        identityVerificationStatus: 'verified',
        featureFlags: {
          voting: true,
          announcements: true,
          dividends: true,
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
        customerId: 'BUN-100002',
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
        customerId: 'BUN-100003',
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
      identifier: undefined,
      email: undefined,
      customerId: undefined,
      memberType: undefined,
      fullName: 'Selamawit Assefa',
      memberNumber: undefined,
      staffNumber: 'STF-2001',
      phone: undefined,
      branchId: 'branch_05',
      districtId: 'district_02',
      branchName: 'Gondar Branch',
      districtName: 'Gondar District',
      permissions: ['dashboard.branch', 'employees.branch', 'loans.branch', 'kyc.branch', 'support.branch', 'notifications.manage', 'reports.read'],
      featureFlags: undefined,
    });
    expect(result.accessToken).toBe('staff-access-token');
    expect(result.refreshToken).toBe('staff-refresh-token');
  });
});
