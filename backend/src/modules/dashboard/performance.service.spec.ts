import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

import {
  MemberType,
  NotificationCampaignStatus,
  NotificationCategory,
  UserRole,
  VoteStatus,
} from '../../common/enums';
import { PerformanceService } from './performance.service';

function createModelMock() {
  return {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  };
}

describe('PerformanceService', () => {
  let memberModel: ReturnType<typeof createModelMock>;
  let loanModel: ReturnType<typeof createModelMock>;
  let savingsAccountModel: ReturnType<typeof createModelMock>;
  let voteModel: ReturnType<typeof createModelMock>;
  let chatConversationModel: ReturnType<typeof createModelMock>;
  let memberProfileModel: ReturnType<typeof createModelMock>;
  let notificationCampaignModel: ReturnType<typeof createModelMock>;
  let managerPerformanceService: {
    getHeadOfficeDistrictSummary: jest.Mock;
    getDistrictBranchSummary: jest.Mock;
    getDistrictTopBranches: jest.Mock;
    getBranchEmployeeSummary: jest.Mock;
  };
  let riskService: {
    getRiskSummary: jest.Mock;
  };
  let service: PerformanceService;

  beforeEach(() => {
    memberModel = createModelMock();
    loanModel = createModelMock();
    savingsAccountModel = createModelMock();
    voteModel = createModelMock();
    chatConversationModel = createModelMock();
    memberProfileModel = createModelMock();
    notificationCampaignModel = createModelMock();
    managerPerformanceService = {
      getHeadOfficeDistrictSummary: jest.fn().mockResolvedValue({
        scope: 'district',
        period: 'week',
        generatedAt: new Date().toISOString(),
        kpis: {
          membersServed: 0,
          customersHelped: 0,
          loansHandled: 0,
          loansApproved: 0,
          loansEscalated: 0,
          kycCompleted: 0,
          supportResolved: 0,
          transactionsProcessed: 0,
          avgHandlingTime: 0,
          pendingTasks: 0,
          pendingApprovals: 0,
          responseTimeMinutes: 0,
          score: 0,
          status: 'good',
        },
        items: [],
      }),
      getDistrictBranchSummary: jest.fn().mockResolvedValue({
        scope: 'branch',
        period: 'week',
        generatedAt: new Date().toISOString(),
        kpis: {
          membersServed: 0,
          customersHelped: 0,
          loansHandled: 0,
          loansApproved: 0,
          loansEscalated: 0,
          kycCompleted: 0,
          supportResolved: 0,
          transactionsProcessed: 0,
          avgHandlingTime: 0,
          pendingTasks: 0,
          pendingApprovals: 0,
          responseTimeMinutes: 0,
          score: 0,
          status: 'good',
        },
        items: [],
      }),
      getDistrictTopBranches: jest.fn().mockResolvedValue([]),
      getBranchEmployeeSummary: jest.fn().mockResolvedValue({
        scope: 'employee',
        period: 'week',
        generatedAt: new Date().toISOString(),
        kpis: {
          membersServed: 0,
          customersHelped: 0,
          loansHandled: 0,
          loansApproved: 0,
          loansEscalated: 0,
          kycCompleted: 0,
          supportResolved: 0,
          transactionsProcessed: 0,
          avgHandlingTime: 0,
          pendingTasks: 4,
          pendingApprovals: 0,
          responseTimeMinutes: 0,
          score: 0,
          status: 'good',
        },
        items: [],
      }),
    };
    riskService = {
      getRiskSummary: jest.fn().mockResolvedValue({
        totalAlerts: 3,
        loanAlerts: 1,
        kycAlerts: 1,
        supportAlerts: 1,
        notificationAlerts: 0,
      }),
    };

    memberModel.countDocuments
      .mockResolvedValueOnce(120)
      .mockResolvedValueOnce(12);
    savingsAccountModel.aggregate.mockResolvedValue([{ totalSavings: 4500000 }]);
    loanModel.aggregate
      .mockResolvedValueOnce([{ totalLoans: 8, pendingApprovals: 3 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ totalLoans: 4, pendingApprovals: 2 }]);
    chatConversationModel.aggregate.mockResolvedValue([
      { openChats: 2, assignedChats: 1, resolvedChats: 4, escalatedChats: 1 },
    ]);
    voteModel.aggregate.mockResolvedValue([
      { activeVotes: 1, draftVotes: 0, publishedVotes: 1 },
    ]);
    notificationCampaignModel.countDocuments.mockResolvedValue(2);
    memberProfileModel.aggregate.mockResolvedValue([
      { completed: 5, pendingReview: 2, needsAction: 1 },
    ]);

    service = new PerformanceService(
      memberModel as never,
      loanModel as never,
      savingsAccountModel as never,
      voteModel as never,
      chatConversationModel as never,
      memberProfileModel as never,
      notificationCampaignModel as never,
      managerPerformanceService as never,
      riskService as never,
    );
  });

  it('returns institution-wide command-center data for head office roles', async () => {
    const currentUser = {
      sub: 'staff_1',
      role: UserRole.HEAD_OFFICE_MANAGER,
    };

    const result = await service.getHeadOfficeSummary(currentUser as never, {
      period: 'week',
    } as never);

    expect(memberModel.countDocuments).toHaveBeenNthCalledWith(1, {
      memberType: MemberType.MEMBER,
    });
    expect(memberModel.countDocuments).toHaveBeenNthCalledWith(2, {
      memberType: MemberType.SHAREHOLDER,
    });
    expect(loanModel.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ $match: {} })]),
    );
    expect(result.totalCustomers).toBe(120);
    expect(result.totalShareholders).toBe(12);
    expect(result.totalLoans).toBe(8);
    expect(result.pendingApprovals).toBe(3);
  });

  it('filters district command-center queries to the current district', async () => {
    const districtId = '65f1a8d744f0d7b7f95dd101';

    await service.getDistrictSummary(
      {
        sub: 'staff_2',
        role: UserRole.DISTRICT_MANAGER,
        districtId,
      } as never,
      { period: 'week' } as never,
    );

    const supportPipeline = chatConversationModel.aggregate.mock.calls[0][0];
    expect(supportPipeline[0].$match.districtId).toBeInstanceOf(Types.ObjectId);

    const kycPipeline = memberProfileModel.aggregate.mock.calls[0][0];
    expect(kycPipeline[0].$match.districtId).toBeInstanceOf(Types.ObjectId);

    const approvalsCall = loanModel.aggregate.mock.calls.find(
      ([pipeline]) => pipeline?.[0]?.$match?.districtId,
    );
    expect(approvalsCall).toBeDefined();
    const approvalsPipeline = approvalsCall?.[0];
    expect(approvalsPipeline[0].$match.districtId).toBeInstanceOf(Types.ObjectId);
    expect(approvalsPipeline[0].$match.status.$in).toContain('approved');
  });

  it('filters branch command-center queries to the current branch', async () => {
    const branchId = '65f1a8d744f0d7b7f95dd201';

    const result = await service.getBranchSummary(
      {
        sub: 'staff_3',
        role: UserRole.BRANCH_MANAGER,
        branchId,
      } as never,
      { period: 'week' } as never,
    );

    const branchLoanCall = loanModel.aggregate.mock.calls.find(
      ([pipeline]) => pipeline?.[0]?.$match?.branchId,
    );
    expect(branchLoanCall).toBeDefined();
    const branchLoanPipeline = branchLoanCall?.[0];
    expect(branchLoanPipeline[0].$match.branchId).toBeInstanceOf(Types.ObjectId);

    expect(result.loansHandled).toBe(8);
    expect(result.kycCompleted).toBe(5);
    expect(result.pendingTasks).toBe(4);
  });

  it('fails cleanly when branch summary is requested without an authenticated user', async () => {
    await expect(service.getBranchSummary(undefined as never, { period: 'week' } as never)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects roles outside their allowed command-center scope', async () => {
    await expect(
      service.getHeadOfficeSummary(
        {
          sub: 'member_1',
          role: UserRole.MEMBER,
        } as never,
        { period: 'week' } as never,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.getDistrictSummary(
        {
          sub: 'staff_4',
          role: UserRole.SUPPORT_AGENT,
        } as never,
        { period: 'week' } as never,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.getBranchSummary(
        {
          sub: 'member_2',
          role: UserRole.MEMBER,
        } as never,
        { period: 'week' } as never,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
