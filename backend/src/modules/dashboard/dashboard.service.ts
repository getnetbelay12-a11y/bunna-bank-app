import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';

import { LoanStatus, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriod, DashboardPeriodQueryDto } from './dto';
import {
  ManagerDashboardSummary,
  PerformanceSummaryItem,
  StaffRankingItem,
  VotingSummaryItem,
} from './interfaces';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { SchoolPayment, SchoolPaymentDocument } from '../payments/schemas/school-payment.schema';
import { StaffPerformanceDaily, StaffPerformanceDailyDocument } from '../staff-activity/schemas/staff-performance-daily.schema';
import { StaffPerformanceWeekly, StaffPerformanceWeeklyDocument } from '../staff-activity/schemas/staff-performance-weekly.schema';
import { StaffPerformanceMonthly, StaffPerformanceMonthlyDocument } from '../staff-activity/schemas/staff-performance-monthly.schema';
import { StaffPerformanceYearly, StaffPerformanceYearlyDocument } from '../staff-activity/schemas/staff-performance-yearly.schema';
import { Vote, VoteDocument } from '../voting/schemas/vote.schema';
import { VoteResponse, VoteResponseDocument } from '../voting/schemas/vote-response.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { MemberType } from '../../common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(SchoolPayment.name)
    private readonly schoolPaymentModel: Model<SchoolPaymentDocument>,
    @InjectModel(StaffPerformanceDaily.name)
    private readonly dailyPerformanceModel: Model<StaffPerformanceDailyDocument>,
    @InjectModel(StaffPerformanceWeekly.name)
    private readonly weeklyPerformanceModel: Model<StaffPerformanceWeeklyDocument>,
    @InjectModel(StaffPerformanceMonthly.name)
    private readonly monthlyPerformanceModel: Model<StaffPerformanceMonthlyDocument>,
    @InjectModel(StaffPerformanceYearly.name)
    private readonly yearlyPerformanceModel: Model<StaffPerformanceYearlyDocument>,
    @InjectModel(Vote.name)
    private readonly voteModel: Model<VoteDocument>,
    @InjectModel(VoteResponse.name)
    private readonly voteResponseModel: Model<VoteResponseDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
  ) {}

  async getSummary(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<ManagerDashboardSummary> {
    this.ensureManagerAccess(currentUser);

    const scope = this.buildScope(currentUser, query);
    const performanceModel = this.resolvePerformanceModel(query.period ?? DashboardPeriod.TODAY);

    const [performance, schoolPayments, pendingLoans] = await Promise.all([
      performanceModel.aggregate<{
        customersServed: number;
        transactionsCount: number;
      }>([
        { $match: scope.performanceMatch },
        {
          $group: {
            _id: null,
            customersServed: { $sum: '$customersHelped' },
            transactionsCount: { $sum: '$transactionsCount' },
          },
        },
        { $project: { _id: 0, customersServed: 1, transactionsCount: 1 } },
      ]),
      this.schoolPaymentModel.countDocuments(scope.collectionMatch),
      this.loanModel.aggregate<{ level: string; count: number }>([
        {
          $match: {
            ...scope.collectionMatch,
            status: { $in: [LoanStatus.SUBMITTED, LoanStatus.BRANCH_REVIEW, LoanStatus.DISTRICT_REVIEW, LoanStatus.HEAD_OFFICE_REVIEW] },
          },
        },
        {
          $group: {
            _id: '$currentLevel',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            level: '$_id',
            count: 1,
          },
        },
      ]),
    ]);

    return {
      customersServed: performance[0]?.customersServed ?? 0,
      transactionsCount: performance[0]?.transactionsCount ?? 0,
      schoolPaymentsCount: schoolPayments,
      pendingLoansByLevel: pendingLoans,
    };
  }

  async getBranchPerformance(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<PerformanceSummaryItem[]> {
    return this.getPerformanceByScope(currentUser, query, 'branchId');
  }

  async getDistrictPerformance(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<PerformanceSummaryItem[]> {
    return this.getPerformanceByScope(currentUser, query, 'districtId');
  }

  async getStaffRanking(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<StaffRankingItem[]> {
    this.ensureManagerAccess(currentUser);
    const scope = this.buildScope(currentUser, query);
    const performanceModel = this.resolvePerformanceModel(query.period ?? DashboardPeriod.TODAY);

    return performanceModel.aggregate<StaffRankingItem>([
      { $match: scope.performanceMatch },
      {
        $project: {
          _id: 0,
          staffId: { $toString: '$staffId' },
          branchId: { $toString: '$branchId' },
          districtId: { $toString: '$districtId' },
          customersServed: '$customersHelped',
          transactionsCount: 1,
          loanApprovedCount: 1,
          schoolPaymentsCount: 1,
          score: {
            $add: [
              '$customersHelped',
              '$transactionsCount',
              { $multiply: ['$loanApprovedCount', 3] },
              '$schoolPaymentsCount',
            ],
          },
        },
      },
      { $sort: { score: -1, loanApprovedCount: -1 } },
      { $limit: 10 },
    ]);
  }

  async getVotingSummary(
    currentUser: AuthenticatedUser,
  ): Promise<VotingSummaryItem[]> {
    this.ensureManagerAccess(currentUser);

    const scope = this.buildManagerScope(currentUser);
    const [votes, eligibleShareholders] = await Promise.all([
      this.voteModel.find({}).sort({ startDate: -1 }).lean<VoteDocument[]>(),
      this.memberModel.countDocuments({
        memberType: MemberType.SHAREHOLDER,
        ...scope,
      }),
    ]);

    return Promise.all(
      votes.map(async (vote) => {
        const totalResponses = await this.voteResponseModel.countDocuments({
          voteId: vote._id,
          ...scope,
        });

        return {
          voteId: vote._id.toString(),
          title: vote.title,
          totalResponses,
          eligibleShareholders,
          participationRate:
            eligibleShareholders === 0
              ? 0
              : Number(((totalResponses / eligibleShareholders) * 100).toFixed(2)),
        };
      }),
    );
  }

  private async getPerformanceByScope(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
    field: 'branchId' | 'districtId',
  ): Promise<PerformanceSummaryItem[]> {
    this.ensureManagerAccess(currentUser);
    const scope = this.buildScope(currentUser, query);
    const performanceModel = this.resolvePerformanceModel(query.period ?? DashboardPeriod.TODAY);

    return performanceModel.aggregate<PerformanceSummaryItem>([
      { $match: scope.performanceMatch },
      {
        $group: {
          _id: `$${field}`,
          customersServed: { $sum: '$customersHelped' },
          transactionsCount: { $sum: '$transactionsCount' },
          loanApprovedCount: { $sum: '$loanApprovedCount' },
          loanRejectedCount: { $sum: '$loanRejectedCount' },
          schoolPaymentsCount: { $sum: '$schoolPaymentsCount' },
          totalTransactionAmount: { $sum: '$totalTransactionAmount' },
        },
      },
      {
        $project: {
          _id: 0,
          scopeId: { $toString: '$_id' },
          customersServed: 1,
          transactionsCount: 1,
          loanApprovedCount: 1,
          loanRejectedCount: 1,
          schoolPaymentsCount: 1,
          totalTransactionAmount: 1,
        },
      },
      { $sort: { totalTransactionAmount: -1 } },
    ]);
  }

  private buildScope(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto) {
    const periodStart = this.resolvePeriodStart(query.period ?? DashboardPeriod.TODAY, query.date ? new Date(query.date) : new Date());
    const collectionMatch: Record<string, unknown> = {
      createdAt: { $gte: periodStart },
    };
    const performanceMatch: Record<string, unknown> = {
      periodStart,
    };

    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      collectionMatch.branchId = new Types.ObjectId(currentUser.branchId);
      performanceMatch.branchId = new Types.ObjectId(currentUser.branchId);
    }

    if (
      [UserRole.DISTRICT_OFFICER, UserRole.DISTRICT_MANAGER].includes(currentUser.role) &&
      currentUser.districtId
    ) {
      collectionMatch.districtId = new Types.ObjectId(currentUser.districtId);
      performanceMatch.districtId = new Types.ObjectId(currentUser.districtId);
    }

    return { collectionMatch, performanceMatch };
  }

  private buildManagerScope(currentUser: AuthenticatedUser) {
    const scope: Record<string, unknown> = {};

    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      scope.branchId = new Types.ObjectId(currentUser.branchId);
    }

    if (
      [UserRole.DISTRICT_OFFICER, UserRole.DISTRICT_MANAGER].includes(currentUser.role) &&
      currentUser.districtId
    ) {
      scope.districtId = new Types.ObjectId(currentUser.districtId);
    }

    return scope;
  }

  private resolvePerformanceModel(period: DashboardPeriod) {
    switch (period) {
      case DashboardPeriod.TODAY:
        return this.dailyPerformanceModel;
      case DashboardPeriod.WEEK:
        return this.weeklyPerformanceModel;
      case DashboardPeriod.MONTH:
        return this.monthlyPerformanceModel;
      case DashboardPeriod.YEAR:
        return this.yearlyPerformanceModel;
    }
  }

  private resolvePeriodStart(period: DashboardPeriod, date: Date): Date {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);

    switch (period) {
      case DashboardPeriod.TODAY:
        return base;
      case DashboardPeriod.WEEK: {
        const day = base.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        base.setDate(base.getDate() + diff);
        return base;
      }
      case DashboardPeriod.MONTH:
        base.setDate(1);
        return base;
      case DashboardPeriod.YEAR:
        base.setMonth(0, 1);
        return base;
    }
  }

  private ensureManagerAccess(currentUser: AuthenticatedUser): void {
    if (
      ![
        UserRole.BRANCH_MANAGER,
        UserRole.DISTRICT_OFFICER,
        UserRole.DISTRICT_MANAGER,
        UserRole.HEAD_OFFICE_OFFICER,
        UserRole.HEAD_OFFICE_MANAGER,
        UserRole.ADMIN,
      ].includes(currentUser.role)
    ) {
      throw new ForbiddenException('Only manager and admin roles can access dashboard data.');
    }
  }
}
