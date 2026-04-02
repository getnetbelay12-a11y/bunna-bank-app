import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';

import { UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { Branch, BranchDocument } from '../members/schemas/branch.schema';
import { District, DistrictDocument } from '../members/schemas/district.schema';
import { Staff, StaffDocument } from '../staff/schemas/staff.schema';
import { BranchPerformanceDaily, BranchPerformanceDailyDocument } from '../staff-activity/schemas/branch-performance-daily.schema';
import { DistrictPerformanceDaily, DistrictPerformanceDailyDocument } from '../staff-activity/schemas/district-performance-daily.schema';
import { StaffPerformanceDaily, StaffPerformanceDailyDocument } from '../staff-activity/schemas/staff-performance-daily.schema';
import { StaffPerformanceMonthly, StaffPerformanceMonthlyDocument } from '../staff-activity/schemas/staff-performance-monthly.schema';
import { StaffPerformanceWeekly, StaffPerformanceWeeklyDocument } from '../staff-activity/schemas/staff-performance-weekly.schema';
import { StaffPerformanceYearly, StaffPerformanceYearlyDocument } from '../staff-activity/schemas/staff-performance-yearly.schema';
import { DashboardPeriod, DashboardPeriodQueryDto } from './dto';
import {
  PerformanceEntityItem,
  PerformanceEntityMetrics,
  PerformanceOverviewResponse,
  PerformanceStatus,
} from './interfaces/manager-performance.interface';

type StaffPerformanceDocument =
  | StaffPerformanceDailyDocument
  | StaffPerformanceWeeklyDocument
  | StaffPerformanceMonthlyDocument
  | StaffPerformanceYearlyDocument;

type AggregateMetrics = Omit<PerformanceEntityMetrics, 'status'>;

@Injectable()
export class ManagerPerformanceService {
  constructor(
    @InjectModel(BranchPerformanceDaily.name)
    private readonly branchPerformanceDailyModel: Model<BranchPerformanceDailyDocument>,
    @InjectModel(DistrictPerformanceDaily.name)
    private readonly districtPerformanceDailyModel: Model<DistrictPerformanceDailyDocument>,
    @InjectModel(StaffPerformanceDaily.name)
    private readonly staffPerformanceDailyModel: Model<StaffPerformanceDailyDocument>,
    @InjectModel(StaffPerformanceWeekly.name)
    private readonly staffPerformanceWeeklyModel: Model<StaffPerformanceWeeklyDocument>,
    @InjectModel(StaffPerformanceMonthly.name)
    private readonly staffPerformanceMonthlyModel: Model<StaffPerformanceMonthlyDocument>,
    @InjectModel(StaffPerformanceYearly.name)
    private readonly staffPerformanceYearlyModel: Model<StaffPerformanceYearlyDocument>,
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    @InjectModel(District.name)
    private readonly districtModel: Model<DistrictDocument>,
    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,
  ) {}

  async getHeadOfficeDistrictSummary(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<PerformanceOverviewResponse> {
    this.ensureHeadOfficeAccess(currentUser);
    const items = await this.loadDistrictItems(query);

    return this.buildOverview('district', query, items);
  }

  async getHeadOfficeTopDistricts(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ) {
    this.ensureHeadOfficeAccess(currentUser);
    const items = await this.loadDistrictItems(query);

    return this.pickTop(items);
  }

  async getHeadOfficeDistrictWatchlist(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ) {
    this.ensureHeadOfficeAccess(currentUser);
    const items = await this.loadDistrictItems(query);

    return this.pickWatchlist(items);
  }

  async getDistrictBranchSummary(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<PerformanceOverviewResponse> {
    this.ensureDistrictAccess(currentUser);
    const items = await this.loadBranchItems(currentUser, query);

    return this.buildOverview('branch', query, items);
  }

  async getDistrictTopBranches(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ) {
    this.ensureDistrictAccess(currentUser);
    const items = await this.loadBranchItems(currentUser, query);

    return this.pickTop(items);
  }

  async getDistrictBranchWatchlist(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ) {
    this.ensureDistrictAccess(currentUser);
    const items = await this.loadBranchItems(currentUser, query);

    return this.pickWatchlist(items);
  }

  async getBranchEmployeeSummary(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<PerformanceOverviewResponse> {
    this.ensureBranchAccess(currentUser);
    const items = await this.loadEmployeeItems(currentUser, query);

    return this.buildOverview('employee', query, items);
  }

  async getBranchTopEmployees(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ) {
    this.ensureBranchAccess(currentUser);
    const items = await this.loadEmployeeItems(currentUser, query);

    return this.pickTop(items);
  }

  async getBranchEmployeeWatchlist(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ) {
    this.ensureBranchAccess(currentUser);
    const items = await this.loadEmployeeItems(currentUser, query);

    return this.pickWatchlist(items);
  }

  private async loadDistrictItems(
    query: DashboardPeriodQueryDto,
  ): Promise<PerformanceEntityItem[]> {
    const { start, end } = this.resolveDateRange(query);
    const items = await this.districtPerformanceDailyModel.aggregate<
      AggregateMetrics & { districtId: Types.ObjectId; districtName?: string }
    >([
      {
        $match: {
          date: {
            $gte: start,
            $lt: end,
          },
        },
      },
      ...this.groupDailyMetrics('$districtId', '$districtName'),
    ]);

    const districtNames = await this.loadDistrictNames(items.map((item) => item.districtId));

    return items.map((item) =>
      this.toPerformanceEntity({
        entityId: item.districtId.toString(),
        entityType: 'district',
        name:
          item.districtName ??
          districtNames.get(item.districtId.toString()) ??
          'District',
        districtId: item.districtId.toString(),
        metrics: item,
      }),
    );
  }

  private async loadBranchItems(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<PerformanceEntityItem[]> {
    const { start, end } = this.resolveDateRange(query);
    const match: Record<string, unknown> = {
      date: {
        $gte: start,
        $lt: end,
      },
    };

    if (currentUser.districtId) {
      match.districtId = new Types.ObjectId(currentUser.districtId);
    }

    const items = await this.branchPerformanceDailyModel.aggregate<
      AggregateMetrics & {
        branchId: Types.ObjectId;
        branchName?: string;
        districtId: Types.ObjectId;
        districtName?: string;
      }
    >([
      { $match: match },
      ...this.groupDailyMetrics('$branchId', '$branchName', {
        districtId: '$districtId',
        districtName: '$districtName',
      }),
    ]);

    const [branchNames, districtNames] = await Promise.all([
      this.loadBranchNames(items.map((item) => item.branchId)),
      this.loadDistrictNames(items.map((item) => item.districtId)),
    ]);

    return items.map((item) =>
      this.toPerformanceEntity({
        entityId: item.branchId.toString(),
        entityType: 'branch',
        name: item.branchName ?? branchNames.get(item.branchId.toString()) ?? 'Branch',
        branchId: item.branchId.toString(),
        branchName:
          item.branchName ?? branchNames.get(item.branchId.toString()) ?? 'Branch',
        districtId: item.districtId.toString(),
        districtName:
          item.districtName ??
          districtNames.get(item.districtId.toString()) ??
          'District',
        metrics: item,
      }),
    );
  }

  private async loadEmployeeItems(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<PerformanceEntityItem[]> {
    const model = this.resolveStaffModel(query.period ?? DashboardPeriod.TODAY);
    const periodStart = this.resolvePeriodStart(
      query.period ?? DashboardPeriod.TODAY,
      query.date ? new Date(query.date) : new Date(),
    );
    const match: Record<string, unknown> = {
      periodStart,
    };

    if (currentUser.branchId) {
      match.branchId = new Types.ObjectId(currentUser.branchId);
    }

    const items = await model
      .find(match)
      .sort({ score: -1, customersHelped: -1 })
      .lean<StaffPerformanceDocument[]>();

    const staffIds = items.map((item) => item.staffId);
    const staffMap = await this.loadStaffMap(staffIds);

    return items.map((item) => {
      const staff = staffMap.get(item.staffId.toString());
      return this.toPerformanceEntity({
        entityId: item.staffId.toString(),
        entityType: 'employee',
        name: staff?.fullName ?? 'Employee',
        branchId: item.branchId.toString(),
        branchName: currentUser.branchName,
        districtId: item.districtId.toString(),
        districtName: currentUser.districtName,
        role: staff?.role,
        metrics: {
          membersServed: item.membersServed ?? item.customersHelped ?? 0,
          customersHelped: item.customersHelped ?? 0,
          loansHandled: item.loansHandled ?? item.loanApplicationsCount ?? 0,
          loansApproved: item.loanApprovedCount ?? 0,
          loansEscalated: item.loansEscalated ?? 0,
          kycCompleted: item.kycCompleted ?? 0,
          supportResolved: item.supportResolved ?? 0,
          transactionsProcessed: item.transactionsCount ?? 0,
          avgHandlingTime: item.avgHandlingTime ?? 0,
          pendingTasks: item.pendingTasks ?? 0,
          pendingApprovals: item.loanApplicationsCount ?? 0,
          responseTimeMinutes: item.responseTimeMinutes ?? 0,
          score: item.score ?? 0,
        },
      });
    });
  }

  private groupDailyMetrics(
    idExpression: string,
    nameExpression: string,
    extraIdFields: Record<string, unknown> = {},
  ): PipelineStage[] {
    return [
      {
        $group: {
          _id: {
            entityId: idExpression,
            entityName: nameExpression,
            ...extraIdFields,
          },
          membersServed: { $sum: '$membersServed' },
          customersHelped: { $sum: '$customersHelped' },
          loansHandled: { $sum: '$loansHandled' },
          loansApproved: { $sum: '$loansApproved' },
          loansEscalated: { $sum: '$loansEscalated' },
          kycCompleted: { $sum: '$kycCompleted' },
          supportResolved: { $sum: '$supportResolved' },
          transactionsProcessed: { $sum: '$transactionsProcessed' },
          avgHandlingTime: { $avg: '$avgHandlingTime' },
          pendingTasks: { $avg: '$pendingTasks' },
          pendingApprovals: { $avg: '$pendingApprovals' },
          responseTimeMinutes: { $avg: '$responseTimeMinutes' },
          score: { $avg: '$score' },
        },
      },
      {
        $project: {
          _id: 0,
          districtId: '$_id.districtId',
          districtName: '$_id.districtName',
          branchId: '$_id.entityId',
          branchName: '$_id.entityName',
          membersServed: 1,
          customersHelped: 1,
          loansHandled: 1,
          loansApproved: 1,
          loansEscalated: 1,
          kycCompleted: 1,
          supportResolved: 1,
          transactionsProcessed: 1,
          avgHandlingTime: { $round: ['$avgHandlingTime', 1] },
          pendingTasks: { $round: ['$pendingTasks', 0] },
          pendingApprovals: { $round: ['$pendingApprovals', 0] },
          responseTimeMinutes: { $round: ['$responseTimeMinutes', 1] },
          score: { $round: ['$score', 1] },
        },
      },
      {
        $addFields: {
          districtId: {
            $ifNull: ['$districtId', '$branchId'],
          },
          districtName: {
            $ifNull: ['$districtName', '$branchName'],
          },
        },
      },
    ];
  }

  private buildOverview(
    scope: 'district' | 'branch' | 'employee',
    query: DashboardPeriodQueryDto,
    items: PerformanceEntityItem[],
  ): PerformanceOverviewResponse {
    return {
      scope,
      period: (query.period ?? DashboardPeriod.TODAY) as PerformanceOverviewResponse['period'],
      generatedAt: new Date().toISOString(),
      kpis: this.summarizeKpis(items),
      items: items.sort((left, right) => right.score - left.score),
    };
  }

  private summarizeKpis(items: PerformanceEntityItem[]): PerformanceEntityMetrics {
    if (items.length === 0) {
      return {
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
      };
    }

    const aggregate = items.reduce<AggregateMetrics>(
      (accumulator, item) => ({
        membersServed: accumulator.membersServed + item.membersServed,
        customersHelped: accumulator.customersHelped + item.customersHelped,
        loansHandled: accumulator.loansHandled + item.loansHandled,
        loansApproved: accumulator.loansApproved + item.loansApproved,
        loansEscalated: accumulator.loansEscalated + item.loansEscalated,
        kycCompleted: accumulator.kycCompleted + item.kycCompleted,
        supportResolved: accumulator.supportResolved + item.supportResolved,
        transactionsProcessed:
          accumulator.transactionsProcessed + item.transactionsProcessed,
        avgHandlingTime: accumulator.avgHandlingTime + item.avgHandlingTime,
        pendingTasks: accumulator.pendingTasks + item.pendingTasks,
        pendingApprovals: accumulator.pendingApprovals + item.pendingApprovals,
        responseTimeMinutes:
          accumulator.responseTimeMinutes + item.responseTimeMinutes,
        score: accumulator.score + item.score,
      }),
      {
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
      },
    );

    const divisor = items.length;
    const normalizedScore = Number((aggregate.score / divisor).toFixed(1));

    return {
      ...aggregate,
      avgHandlingTime: Number((aggregate.avgHandlingTime / divisor).toFixed(1)),
      pendingTasks: Number((aggregate.pendingTasks / divisor).toFixed(0)),
      pendingApprovals: Number((aggregate.pendingApprovals / divisor).toFixed(0)),
      responseTimeMinutes: Number(
        (aggregate.responseTimeMinutes / divisor).toFixed(1),
      ),
      score: normalizedScore,
      status: this.resolveStatus(normalizedScore),
    };
  }

  private pickTop(items: PerformanceEntityItem[]) {
    return [...items].sort((left, right) => right.score - left.score).slice(0, 5);
  }

  private pickWatchlist(items: PerformanceEntityItem[]) {
    const flagged = items
      .filter((item) => ['watch', 'needs_support'].includes(item.status))
      .sort((left, right) => left.score - right.score);

    if (flagged.length > 0) {
      return flagged.slice(0, 5);
    }

    return [...items].sort((left, right) => left.score - right.score).slice(0, 5);
  }

  private toPerformanceEntity(input: {
    entityId: string;
    entityType: 'district' | 'branch' | 'employee';
    name: string;
    districtId?: string;
    districtName?: string;
    branchId?: string;
    branchName?: string;
    role?: string;
    metrics: AggregateMetrics;
  }): PerformanceEntityItem {
    const score = Number((input.metrics.score ?? 0).toFixed(1));
    return {
      entityId: input.entityId,
      entityType: input.entityType,
      name: input.name,
      districtId: input.districtId,
      districtName: input.districtName,
      branchId: input.branchId,
      branchName: input.branchName,
      role: input.role,
      membersServed: input.metrics.membersServed,
      customersHelped: input.metrics.customersHelped,
      loansHandled: input.metrics.loansHandled,
      loansApproved: input.metrics.loansApproved,
      loansEscalated: input.metrics.loansEscalated,
      kycCompleted: input.metrics.kycCompleted,
      supportResolved: input.metrics.supportResolved,
      transactionsProcessed: input.metrics.transactionsProcessed,
      avgHandlingTime: Number((input.metrics.avgHandlingTime ?? 0).toFixed(1)),
      pendingTasks: Math.round(input.metrics.pendingTasks ?? 0),
      pendingApprovals: Math.round(input.metrics.pendingApprovals ?? 0),
      responseTimeMinutes: Number(
        (input.metrics.responseTimeMinutes ?? 0).toFixed(1),
      ),
      score,
      status: this.resolveStatus(score),
    };
  }

  private resolveStatus(score: number): PerformanceStatus {
    if (score >= 88) {
      return 'excellent';
    }
    if (score >= 72) {
      return 'good';
    }
    if (score >= 58) {
      return 'watch';
    }
    return 'needs_support';
  }

  private async loadBranchNames(branchIds: Types.ObjectId[]) {
    const branches = await this.branchModel
      .find({ _id: { $in: this.uniqueObjectIds(branchIds) } })
      .select('_id name')
      .lean<Array<{ _id: Types.ObjectId; name: string }>>();

    return new Map(branches.map((item) => [item._id.toString(), item.name]));
  }

  private async loadDistrictNames(districtIds: Types.ObjectId[]) {
    const districts = await this.districtModel
      .find({ _id: { $in: this.uniqueObjectIds(districtIds) } })
      .select('_id name')
      .lean<Array<{ _id: Types.ObjectId; name: string }>>();

    return new Map(districts.map((item) => [item._id.toString(), item.name]));
  }

  private async loadStaffMap(staffIds: Types.ObjectId[]) {
    const staff = await this.staffModel
      .find({ _id: { $in: this.uniqueObjectIds(staffIds) } })
      .select('_id fullName role')
      .lean<Array<{ _id: Types.ObjectId; fullName: string; role: string }>>();

    return new Map(staff.map((item) => [item._id.toString(), item]));
  }

  private uniqueObjectIds(values: Types.ObjectId[]) {
    return [...new Map(values.map((value) => [value.toString(), value])).values()];
  }

  private resolveStaffModel(period: DashboardPeriod) {
    switch (period) {
      case DashboardPeriod.TODAY:
        return this.staffPerformanceDailyModel;
      case DashboardPeriod.WEEK:
        return this.staffPerformanceWeeklyModel;
      case DashboardPeriod.MONTH:
        return this.staffPerformanceMonthlyModel;
      case DashboardPeriod.YEAR:
        return this.staffPerformanceYearlyModel;
    }
  }

  private resolveDateRange(query: DashboardPeriodQueryDto) {
    const period = query.period ?? DashboardPeriod.TODAY;
    const start = this.resolvePeriodStart(
      period,
      query.date ? new Date(query.date) : new Date(),
    );
    const end = new Date(start);

    switch (period) {
      case DashboardPeriod.TODAY:
        end.setDate(end.getDate() + 1);
        break;
      case DashboardPeriod.WEEK:
        end.setDate(end.getDate() + 7);
        break;
      case DashboardPeriod.MONTH:
        end.setMonth(end.getMonth() + 1);
        break;
      case DashboardPeriod.YEAR:
        end.setFullYear(end.getFullYear() + 1);
        break;
    }

    return { start, end };
  }

  private resolvePeriodStart(period: DashboardPeriod, date: Date): Date {
    const base = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ));

    switch (period) {
      case DashboardPeriod.TODAY:
        return base;
      case DashboardPeriod.WEEK: {
        const day = base.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        base.setUTCDate(base.getUTCDate() + diff);
        return base;
      }
      case DashboardPeriod.MONTH:
        base.setUTCDate(1);
        return base;
      case DashboardPeriod.YEAR:
        base.setUTCMonth(0, 1);
        return base;
    }
  }

  private ensureHeadOfficeAccess(currentUser: AuthenticatedUser) {
    if (
      ![
        UserRole.HEAD_OFFICE_MANAGER,
        UserRole.HEAD_OFFICE_OFFICER,
        UserRole.ADMIN,
      ].includes(currentUser.role)
    ) {
      throw new ForbiddenException(
        'Only head office roles can access district performance.',
      );
    }
  }

  private ensureDistrictAccess(currentUser: AuthenticatedUser) {
    if (
      ![
        UserRole.DISTRICT_MANAGER,
        UserRole.DISTRICT_OFFICER,
        UserRole.ADMIN,
      ].includes(currentUser.role)
    ) {
      throw new ForbiddenException(
        'Only district roles can access branch performance.',
      );
    }
  }

  private ensureBranchAccess(currentUser: AuthenticatedUser) {
    if (![UserRole.BRANCH_MANAGER, UserRole.ADMIN].includes(currentUser.role)) {
      throw new ForbiddenException(
        'Only branch managers can access employee performance.',
      );
    }
  }
}
