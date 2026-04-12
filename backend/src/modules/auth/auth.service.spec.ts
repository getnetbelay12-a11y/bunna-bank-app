import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';

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
  let staffStepUpTokenModel: {
    create: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };
  let auditService: {
    log: jest.Mock;
    logActorAction: jest.Mock;
    getCurrentOnboardingReviewDecision: jest.Mock;
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
      verifyAsync: jest.fn(),
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
    staffStepUpTokenModel = {
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    auditService = {
      log: jest.fn(),
      logActorAction: jest.fn(),
      getCurrentOnboardingReviewDecision: jest.fn().mockResolvedValue({
        decisionVersion: 3,
      }),
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
        findOneAndUpdate: jest.fn(),
      } as never,
      staffStepUpTokenModel as never,
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
      auditService as never,
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

  it('issues a short-lived staff step-up token after password recheck', async () => {
    const staffId = new Types.ObjectId().toString();
    const memberId = new Types.ObjectId().toString();
    jwtService.signAsync = jest.fn().mockResolvedValue('step-up-token') as never;
    staffRepository.findByIdentifier.mockResolvedValue({
      id: staffId,
      role: UserRole.ADMIN,
      identifier: 'admin.head-office@bunnabank.com',
      passwordHash: 'admin-secret',
    });

    const result = await service.verifyStaffStepUp(
      {
        sub: staffId,
        role: UserRole.ADMIN,
        identifier: 'admin.head-office@bunnabank.com',
      },
      {
        password: 'admin-secret',
        memberId,
      },
    );

    expect(result.stepUpToken).toBe('step-up-token');
    expect(staffStepUpTokenModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'kyc_blocking_mismatch_approval',
        method: 'password_recheck',
      }),
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        jti: expect.any(String),
        sub: staffId,
        role: UserRole.ADMIN,
        purpose: 'kyc_blocking_mismatch_approval',
        targetMemberId: memberId,
        boundDecisionVersion: 3,
      }),
      expect.objectContaining({
        expiresIn: '5m',
      }),
    );
  });

  it('verifies high-risk approval step-up tokens against the current staff session', async () => {
    const staffId = new Types.ObjectId().toString();
    const memberId = new Types.ObjectId().toString();
    jwtService.verifyAsync = jest.fn().mockResolvedValue({
      jti: 'token-1',
      sub: staffId,
      role: UserRole.ADMIN,
      purpose: 'kyc_blocking_mismatch_approval',
      targetMemberId: memberId,
      boundDecisionVersion: 3,
      method: 'password_recheck',
      verifiedAt: '2026-03-18T12:00:00.000Z',
    }) as never;
    staffStepUpTokenModel.findOneAndUpdate.mockResolvedValue({
      tokenId: 'token-1',
      boundDecisionVersion: 3,
      consumedAt: new Date('2026-03-18T12:01:00.000Z'),
    });

    const result = await service.verifyHighRiskApprovalStepUpToken(
      {
        sub: staffId,
        role: UserRole.ADMIN,
      },
      'step-up-token',
      memberId,
    );

    expect(result).toEqual({
      verifiedAt: '2026-03-18T12:00:00.000Z',
      method: 'password_recheck',
      boundMemberId: memberId,
      boundDecisionVersion: 3,
    });
    expect(staffStepUpTokenModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenId: 'token-1',
        memberId: new Types.ObjectId(memberId),
        purpose: 'kyc_blocking_mismatch_approval',
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          consumedAt: expect.any(Date),
        }),
      }),
      expect.objectContaining({ new: true }),
    );
  });

  it('rejects replayed high-risk approval step-up tokens', async () => {
    const staffId = new Types.ObjectId().toString();
    const memberId = new Types.ObjectId().toString();
    jwtService.verifyAsync = jest.fn().mockResolvedValue({
      jti: 'token-1',
      sub: staffId,
      role: UserRole.ADMIN,
      purpose: 'kyc_blocking_mismatch_approval',
      targetMemberId: memberId,
      boundDecisionVersion: 3,
      method: 'password_recheck',
      verifiedAt: '2026-03-18T12:00:00.000Z',
    }) as never;
    staffStepUpTokenModel.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      service.verifyHighRiskApprovalStepUpToken(
        {
          sub: staffId,
          role: UserRole.ADMIN,
        },
        'step-up-token',
        memberId,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(auditService.logActorAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'staff_step_up_verification_failed',
        entityId: memberId,
        after: expect.objectContaining({
          reasonCode: 'replayed_or_expired_token',
        }),
      }),
    );
  });

  it('rejects step-up tokens if the onboarding decision version changed after issuance', async () => {
    const staffId = new Types.ObjectId().toString();
    const memberId = new Types.ObjectId().toString();
    jwtService.verifyAsync = jest.fn().mockResolvedValue({
      jti: 'token-1',
      sub: staffId,
      role: UserRole.ADMIN,
      purpose: 'kyc_blocking_mismatch_approval',
      targetMemberId: memberId,
      boundDecisionVersion: 3,
      method: 'password_recheck',
      verifiedAt: '2026-03-18T12:00:00.000Z',
    }) as never;
    staffStepUpTokenModel.findOneAndUpdate.mockResolvedValue({
      tokenId: 'token-1',
      boundDecisionVersion: 3,
      consumedAt: new Date('2026-03-18T12:01:00.000Z'),
    });
    auditService.getCurrentOnboardingReviewDecision.mockResolvedValueOnce({
      decisionVersion: 4,
    });

    await expect(
      service.verifyHighRiskApprovalStepUpToken(
        {
          sub: staffId,
          role: UserRole.ADMIN,
        },
        'step-up-token',
        memberId,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(auditService.logActorAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'staff_step_up_verification_failed',
        entityId: memberId,
        after: expect.objectContaining({
          reasonCode: 'decision_version_mismatch',
        }),
      }),
    );
  });

  it('audits invalid step-up passwords with a specific reason code', async () => {
    const staffId = new Types.ObjectId().toString();
    const memberId = new Types.ObjectId().toString();
    staffRepository.findByIdentifier.mockResolvedValue({
      id: staffId,
      role: UserRole.ADMIN,
      identifier: 'admin.head-office@bunnabank.com',
      passwordHash: 'admin-secret',
    });

    await expect(
      service.verifyStaffStepUp(
        {
          sub: staffId,
          role: UserRole.ADMIN,
          identifier: 'admin.head-office@bunnabank.com',
        },
        {
          password: 'wrong-password',
          memberId,
        },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(auditService.logActorAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'staff_step_up_verification_failed',
        entityId: memberId,
        after: expect.objectContaining({
          reasonCode: 'invalid_password',
        }),
      }),
    );
  });
});
