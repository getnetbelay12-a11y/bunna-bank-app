import { ForbiddenException } from '@nestjs/common';
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
  let autopayModel: { find: jest.Mock; findOne: jest.Mock };
  let auditService: { log: jest.Mock };
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
    autopayModel = { find: jest.fn(), findOne: jest.fn() };
    auditService = { log: jest.fn() };

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
      autopayModel as never,
      auditService as never,
    );
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
});
