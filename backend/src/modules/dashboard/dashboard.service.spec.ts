import { ForbiddenException } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../common/enums';
import { DashboardService } from './dashboard.service';
import { DashboardPeriod } from './dto';

describe('DashboardService', () => {
  let loanModel: { aggregate: jest.Mock };
  let schoolPaymentModel: { countDocuments: jest.Mock };
  let dailyModel: { aggregate: jest.Mock };
  let weeklyModel: { aggregate: jest.Mock };
  let monthlyModel: { aggregate: jest.Mock };
  let yearlyModel: { aggregate: jest.Mock };
  let voteModel: { find: jest.Mock };
  let voteResponseModel: { countDocuments: jest.Mock };
  let memberModel: { countDocuments: jest.Mock; findById: jest.Mock };
  let memberProfileModel: {
    aggregate: jest.Mock;
    findOne: jest.Mock;
  };
  let onboardingEvidenceModel: { findOne: jest.Mock };
  let autopayModel: { find: jest.Mock; findOne: jest.Mock };
  let authService: { verifyHighRiskApprovalStepUpToken: jest.Mock };
  let auditService: { logActorAction: jest.Mock; logOnboardingReviewDecision: jest.Mock };
  let storageService: { getDownloadUrl: jest.Mock; getStoredDocumentMetadata: jest.Mock };
  let configService: { get: jest.Mock };
  let service: DashboardService;

  beforeEach(() => {
    loanModel = { aggregate: jest.fn() };
    schoolPaymentModel = { countDocuments: jest.fn() };
    dailyModel = { aggregate: jest.fn() };
    weeklyModel = { aggregate: jest.fn() };
    monthlyModel = { aggregate: jest.fn() };
    yearlyModel = { aggregate: jest.fn() };
    voteModel = { find: jest.fn() };
    voteResponseModel = { countDocuments: jest.fn() };
    memberModel = { countDocuments: jest.fn(), findById: jest.fn() };
    memberProfileModel = { aggregate: jest.fn(), findOne: jest.fn() };
    onboardingEvidenceModel = { findOne: jest.fn() };
    autopayModel = { find: jest.fn(), findOne: jest.fn() };
    authService = { verifyHighRiskApprovalStepUpToken: jest.fn() };
    auditService = { logActorAction: jest.fn(), logOnboardingReviewDecision: jest.fn() };
    storageService = {
      getDownloadUrl: jest.fn(),
      getStoredDocumentMetadata: jest.fn(),
    };
    configService = { get: jest.fn() };
    configService.get.mockImplementation((key: string) => {
      if (key === 'onboarding.policyVersion') {
        return 'v1';
      }
      if (key === 'onboarding.blockingMismatchFields') {
        return ['fullName', 'firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 'faydaFin'];
      }
      if (key === 'onboarding.requireApprovalJustification') {
        return true;
      }
      if (key === 'onboarding.blockingMismatchApprovalRoles') {
        return ['head_office_manager', 'admin'];
      }
      if (key === 'onboarding.blockingMismatchApprovalReasonCodes') {
        return [
          'official_source_verified',
          'manual_document_review',
          'customer_profile_corrected',
        ];
      }
      if (key === 'onboarding.supersessionReasonCodes') {
        return [
          'review_progressed',
          'customer_update_requested',
          'approval_recorded',
          'decision_corrected',
        ];
      }
      return undefined;
    });

    service = new DashboardService(
      loanModel as never,
      schoolPaymentModel as never,
      dailyModel as never,
      weeklyModel as never,
      monthlyModel as never,
      yearlyModel as never,
      voteModel as never,
      voteResponseModel as never,
      memberModel as never,
      memberProfileModel as never,
      onboardingEvidenceModel as never,
      autopayModel as never,
      authService as never,
      auditService as never,
      storageService as never,
      configService as never,
    );
    storageService.getStoredDocumentMetadata.mockImplementation(async (storageKey: string) => ({
      provider: 'local',
      storageKey,
      originalFileName: storageKey.split('/').pop() ?? storageKey,
      sizeBytes: 1024,
      sha256Hash: `${storageKey}-hash`,
    }));
    authService.verifyHighRiskApprovalStepUpToken.mockResolvedValue({
      verifiedAt: '2026-03-18T12:00:00.000Z',
      method: 'password_recheck',
      boundMemberId: '507f1f77bcf86cd799439011',
      boundDecisionVersion: 3,
    });
  });

  it('builds manager summary data', async () => {
    dailyModel.aggregate.mockResolvedValue([{ customersServed: 12, transactionsCount: 20 }]);
    schoolPaymentModel.countDocuments.mockResolvedValue(5);
    loanModel.aggregate.mockResolvedValue([{ level: 'branch', count: 3 }]);

    const result = await service.getSummary(
      { sub: 'staff_1', role: UserRole.ADMIN },
      { period: DashboardPeriod.TODAY },
    );

    expect(result).toEqual({
      customersServed: 12,
      transactionsCount: 20,
      schoolPaymentsCount: 5,
      pendingLoansByLevel: [{ level: 'branch', count: 3 }],
    });
  });

  it('builds staff ranking from performance records', async () => {
    monthlyModel.aggregate.mockResolvedValue([
      {
        staffId: 'staff_1',
        branchId: 'branch_1',
        districtId: 'district_1',
        score: 18,
        customersServed: 5,
        transactionsCount: 4,
        loanApprovedCount: 3,
        schoolPaymentsCount: 0,
      },
    ]);

    const result = await service.getStaffRanking(
      { sub: 'staff_1', role: UserRole.HEAD_OFFICE_MANAGER },
      { period: DashboardPeriod.MONTH },
    );

    expect(result[0].score).toBe(18);
  });

  it('builds voting participation summary', async () => {
    voteModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: { toString: () => 'vote_1' }, title: 'Board 2026' },
        ]),
      }),
    });
    memberModel.countDocuments.mockResolvedValue(100);
    voteResponseModel.countDocuments.mockResolvedValue(40);

    const result = await service.getVotingSummary({
      sub: 'staff_1',
      role: UserRole.ADMIN,
    });

    expect(result).toEqual([
      {
        voteId: 'vote_1',
        title: 'Board 2026',
        totalResponses: 40,
        eligibleShareholders: 100,
        participationRate: 40,
      },
    ]);
  });

  it('builds onboarding review queue', async () => {
    memberProfileModel.aggregate.mockResolvedValue([
      {
        memberId: 'member_1',
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        onboardingReviewStatus: 'submitted',
        requiredAction: 'Validate Fayda QR evidence',
      },
    ]);

    const result = await service.getOnboardingReviewQueue({
      sub: 'staff_1',
      role: UserRole.ADMIN,
    });

    expect(result).toHaveLength(1);
    expect(result[0].onboardingReviewStatus).toBe('submitted');
  });

  it('rejects non-manager access', async () => {
    await expect(
      service.getSummary(
        { sub: 'member_1', role: UserRole.MEMBER },
        { period: DashboardPeriod.TODAY },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects blocking mismatch approval for unauthorized roles', async () => {
    const saveProfile = jest.fn().mockResolvedValue(undefined);
    const saveMember = jest.fn().mockResolvedValue(undefined);
    memberProfileModel.findOne.mockResolvedValue({
      memberId: '507f1f77bcf86cd799439011',
      onboardingReviewStatus: 'review_in_progress',
      identityVerificationStatus: 'pending_review',
      membershipStatus: 'pending_review',
      onboardingReviewNote: undefined,
      dateOfBirth: new Date('1988-04-12'),
      save: saveProfile,
    });
    memberModel.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Abebe Kebede',
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '0911000001',
      region: 'Amhara',
      city: 'Bahir Dar',
      preferredBranchName: 'Bahir Dar Main Branch',
      faydaFin: '425921324028',
      save: saveMember,
    });
    onboardingEvidenceModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        extractedFaydaData: {
          fullName: 'Abebe Kebede',
          firstName: 'Abebe',
          lastName: 'Kebede',
          dateOfBirth: '1990-02-02',
          phoneNumber: '0911000001',
          faydaFin: '425921324028',
        },
      }),
    });

    await expect(
      service.updateOnboardingReview(
        { sub: 'staff_1', role: UserRole.BRANCH_MANAGER },
        '507f1f77bcf86cd799439011',
        {
          status: 'approved',
          note: 'Attempted branch approval.',
          approvalReasonCode: 'manual_document_review',
          approvalJustification: 'Looks acceptable.',
          acknowledgedMismatchFields: ['dateOfBirth'],
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(saveProfile).not.toHaveBeenCalled();
    expect(saveMember).not.toHaveBeenCalled();
  });

  it('requires a structured approval reason code for blocking mismatches', async () => {
    const saveProfile = jest.fn().mockResolvedValue(undefined);
    const saveMember = jest.fn().mockResolvedValue(undefined);
    memberProfileModel.findOne.mockResolvedValue({
      memberId: '507f1f77bcf86cd799439011',
      onboardingReviewStatus: 'review_in_progress',
      identityVerificationStatus: 'pending_review',
      membershipStatus: 'pending_review',
      onboardingReviewNote: undefined,
      dateOfBirth: new Date('1988-04-12'),
      save: saveProfile,
    });
    memberModel.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Abebe Kebede',
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '0911000001',
      region: 'Amhara',
      city: 'Bahir Dar',
      preferredBranchName: 'Bahir Dar Main Branch',
      faydaFin: '425921324028',
      save: saveMember,
    });
    onboardingEvidenceModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        extractedFaydaData: {
          fullName: 'Abebe Kebede',
          firstName: 'Abebe',
          lastName: 'Kebede',
          dateOfBirth: '1990-02-02',
          phoneNumber: '0911000001',
          faydaFin: '425921324028',
        },
      }),
    });

    await expect(
      service.updateOnboardingReview(
        { sub: 'staff_1', role: UserRole.ADMIN },
        '507f1f77bcf86cd799439011',
        {
          status: 'approved',
          note: 'Attempted approval without reason code.',
          approvalJustification: 'Manual evidence review completed.',
          acknowledgedMismatchFields: ['dateOfBirth'],
        },
      ),
    ).rejects.toThrow(/Approval reason code is required/);
    expect(saveProfile).not.toHaveBeenCalled();
    expect(saveMember).not.toHaveBeenCalled();
  });

  it('rejects invalid supersession reason codes', async () => {
    const saveProfile = jest.fn().mockResolvedValue(undefined);
    const saveMember = jest.fn().mockResolvedValue(undefined);
    memberProfileModel.findOne.mockResolvedValue({
      memberId: '507f1f77bcf86cd799439011',
      onboardingReviewStatus: 'review_in_progress',
      identityVerificationStatus: 'pending_review',
      membershipStatus: 'pending_review',
      onboardingReviewNote: undefined,
      dateOfBirth: new Date('1988-04-12'),
      save: saveProfile,
    });
    memberModel.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Abebe Kebede',
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '0911000001',
      region: 'Amhara',
      city: 'Bahir Dar',
      preferredBranchName: 'Bahir Dar Main Branch',
      faydaFin: '425921324028',
      save: saveMember,
    });
    onboardingEvidenceModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        extractedFaydaData: {
          fullName: 'Abebe Kebede',
          firstName: 'Abebe',
          lastName: 'Kebede',
          dateOfBirth: '1988-04-12',
          phoneNumber: '0911000001',
          faydaFin: '425921324028',
        },
      }),
    });

    await expect(
      service.updateOnboardingReview(
        { sub: 'staff_1', role: UserRole.ADMIN },
        '507f1f77bcf86cd799439011',
        {
          status: 'review_in_progress',
          note: 'Move into active review.',
          supersessionReasonCode: 'bad_code',
        },
      ),
    ).rejects.toThrow(/Supersession reason code is invalid/);
    expect(auditService.logOnboardingReviewDecision).not.toHaveBeenCalled();
  });

  it('forwards supersession acknowledgments on approved onboarding review', async () => {
    const saveProfile = jest.fn().mockResolvedValue(undefined);
    const saveMember = jest.fn().mockResolvedValue(undefined);
    memberProfileModel.findOne.mockResolvedValue({
      memberId: '507f1f77bcf86cd799439011',
      onboardingReviewStatus: 'review_in_progress',
      identityVerificationStatus: 'pending_review',
      membershipStatus: 'pending_review',
      onboardingReviewNote: undefined,
      dateOfBirth: new Date('1988-04-12'),
      save: saveProfile,
    });
    memberModel.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Abebe Kebede',
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '0911000001',
      region: 'Amhara',
      city: 'Bahir Dar',
      preferredBranchName: 'Bahir Dar Main Branch',
      faydaFin: '425921324028',
      kycStatus: 'pending',
      save: saveMember,
    });
    onboardingEvidenceModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        extractedFaydaData: {
          fullName: 'Abebe Kebede',
          firstName: 'Abebe',
          lastName: 'Kebede',
          dateOfBirth: '1988-04-12',
          phoneNumber: '0911000001',
          faydaFin: '425921324028',
        },
      }),
    });
    memberProfileModel.aggregate.mockResolvedValue([
      {
        memberId: '507f1f77bcf86cd799439011',
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        onboardingReviewStatus: 'approved',
        requiredAction: 'No further action required',
      },
    ]);

    await service.updateOnboardingReview(
      { sub: 'staff_1', role: UserRole.ADMIN },
      '507f1f77bcf86cd799439011',
      {
        status: 'approved',
        note: 'Approved after evidence review.',
        approvalReasonCode: 'official_source_verified',
        supersessionReasonCode: 'approval_recorded',
        acknowledgedMismatchFields: [],
        acknowledgedSupersessionFields: [
          'status',
          'note',
          'approvalReasonCode',
          'approvalJustification',
          'acknowledgedMismatchFields',
        ],
      },
    );

    expect(auditService.logOnboardingReviewDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        supersessionReasonCode: 'approval_recorded',
        acknowledgedSupersessionFields: [
          'status',
          'note',
          'approvalReasonCode',
          'approvalJustification',
          'acknowledgedMismatchFields',
        ],
      }),
    );
  });

  it('requires a step-up token for blocking mismatch approval', async () => {
    const saveProfile = jest.fn().mockResolvedValue(undefined);
    const saveMember = jest.fn().mockResolvedValue(undefined);
    authService.verifyHighRiskApprovalStepUpToken.mockRejectedValue(
      new UnauthorizedException('Step-up verification is required for high-risk onboarding approval.'),
    );
    memberProfileModel.findOne.mockResolvedValue({
      memberId: '507f1f77bcf86cd799439011',
      onboardingReviewStatus: 'review_in_progress',
      identityVerificationStatus: 'pending_review',
      membershipStatus: 'pending_review',
      onboardingReviewNote: undefined,
      dateOfBirth: new Date('1988-04-12'),
      save: saveProfile,
    });
    memberModel.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Abebe Kebede',
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '0911000001',
      region: 'Amhara',
      city: 'Bahir Dar',
      preferredBranchName: 'Bahir Dar Main Branch',
      faydaFin: '425921324028',
      save: saveMember,
    });
    onboardingEvidenceModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        extractedFaydaData: {
          fullName: 'Abebe Kebede',
          firstName: 'Abebe',
          lastName: 'Kebede',
          dateOfBirth: '1990-02-02',
          phoneNumber: '0911000001',
          faydaFin: '425921324028',
        },
      }),
    });

    await expect(
      service.updateOnboardingReview(
        { sub: 'staff_1', role: UserRole.ADMIN, identifier: 'admin.head-office@bunnabank.com' },
        '507f1f77bcf86cd799439011',
        {
          status: 'approved',
          note: 'Attempted approval without step-up token.',
          approvalReasonCode: 'manual_document_review',
          supersessionReasonCode: 'approval_recorded',
          approvalJustification: 'Manual document review completed and accepted.',
          acknowledgedMismatchFields: ['dateOfBirth'],
          acknowledgedSupersessionFields: [
            'status',
            'note',
            'approvalReasonCode',
            'approvalJustification',
            'acknowledgedMismatchFields',
          ],
        },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(auditService.logOnboardingReviewDecision).not.toHaveBeenCalled();
  });

  it('requires acknowledgment for each blocking mismatch before approval', async () => {
    const saveProfile = jest.fn().mockResolvedValue(undefined);
    const saveMember = jest.fn().mockResolvedValue(undefined);
    memberProfileModel.findOne.mockResolvedValue({
      memberId: '507f1f77bcf86cd799439011',
      onboardingReviewStatus: 'review_in_progress',
      identityVerificationStatus: 'pending_review',
      membershipStatus: 'pending_review',
      onboardingReviewNote: undefined,
      dateOfBirth: new Date('1988-04-12'),
      save: saveProfile,
    });
    memberModel.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Abebe Kebede',
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '0911000001',
      region: 'Amhara',
      city: 'Bahir Dar',
      preferredBranchName: 'Bahir Dar Main Branch',
      faydaFin: '425921324028',
      save: saveMember,
    });
    onboardingEvidenceModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        extractedFaydaData: {
          fullName: 'Abebe Kebede',
          firstName: 'Abebe',
          lastName: 'Kebede',
          dateOfBirth: '1990-02-02',
          phoneNumber: '0911999999',
          faydaFin: '425921324028',
        },
      }),
    });

    await expect(
      service.updateOnboardingReview(
        { sub: 'staff_1', role: UserRole.ADMIN },
        '507f1f77bcf86cd799439011',
        {
          status: 'approved',
          note: 'Attempted approval without full acknowledgments.',
          approvalReasonCode: 'manual_document_review',
          approvalJustification:
            'Manual document review was completed and appears acceptable.',
          acknowledgedMismatchFields: ['dateOfBirth'],
        },
      ),
    ).rejects.toThrow(/Each blocking mismatch must be acknowledged/);
    expect(saveProfile).not.toHaveBeenCalled();
    expect(saveMember).not.toHaveBeenCalled();
  });

  it('logs the applied review policy snapshot on approved onboarding review', async () => {
    const saveProfile = jest.fn().mockResolvedValue(undefined);
    const saveMember = jest.fn().mockResolvedValue(undefined);
    memberProfileModel.findOne.mockResolvedValue({
      memberId: '507f1f77bcf86cd799439011',
      onboardingReviewStatus: 'review_in_progress',
      identityVerificationStatus: 'pending_review',
      membershipStatus: 'pending_review',
      onboardingReviewNote: undefined,
      dateOfBirth: new Date('1988-04-12'),
      save: saveProfile,
    });
    memberModel.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Abebe Kebede',
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '0911000001',
      region: 'Amhara',
      city: 'Bahir Dar',
      preferredBranchName: 'Bahir Dar Main Branch',
      faydaFin: '425921324028',
      kycStatus: 'pending',
      save: saveMember,
    });
    onboardingEvidenceModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        faydaFrontImage: 'kyc/member_1/fayda-front.png',
        faydaBackImage: 'kyc/member_1/fayda-back.png',
        selfieImage: 'kyc/member_1/selfie.png',
        extractedFaydaData: {
          fullName: 'Abebe Kebede',
          firstName: 'Abebe',
          lastName: 'Kebede',
          dateOfBirth: '1988-04-12',
          phoneNumber: '0911000001',
          faydaFin: '425921324028',
          extractionMethod: 'sample_fayda_prefill',
        },
      }),
    });
    memberProfileModel.aggregate.mockResolvedValue([
      {
        memberId: '507f1f77bcf86cd799439011',
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        onboardingReviewStatus: 'approved',
        requiredAction: 'No further action required',
      },
    ]);

    await service.updateOnboardingReview(
      { sub: 'staff_1', role: UserRole.ADMIN },
      '507f1f77bcf86cd799439011',
      {
        status: 'approved',
        note: 'Approved after evidence review.',
        approvalReasonCode: 'official_source_verified',
        acknowledgedMismatchFields: [],
      },
    );

    expect(auditService.logOnboardingReviewDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        after: expect.objectContaining({
          approvalReasonCode: 'official_source_verified',
          acknowledgedMismatchFields: [],
          evidenceReferences: {
            faydaFrontStorageKey: 'kyc/member_1/fayda-front.png',
            faydaFrontSha256Hash: 'kyc/member_1/fayda-front.png-hash',
            faydaBackStorageKey: 'kyc/member_1/fayda-back.png',
            faydaBackSha256Hash: 'kyc/member_1/fayda-back.png-hash',
            selfieStorageKey: 'kyc/member_1/selfie.png',
            selfieSha256Hash: 'kyc/member_1/selfie.png-hash',
            extractionMethod: 'sample_fayda_prefill',
          },
          reviewPolicySnapshot: {
            policyVersion: 'v1',
            blockingMismatchFields: [
              'fullName',
              'firstName',
              'lastName',
              'dateOfBirth',
              'phoneNumber',
              'faydaFin',
            ],
            blockingMismatchApprovalRoles: ['head_office_manager', 'admin'],
            blockingMismatchApprovalReasonCodes: [
              'official_source_verified',
              'manual_document_review',
              'customer_profile_corrected',
            ],
            requireApprovalJustification: true,
          },
        }),
      }),
    );
  });
});
