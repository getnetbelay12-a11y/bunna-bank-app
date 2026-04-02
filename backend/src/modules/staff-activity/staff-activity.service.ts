import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';

import { ActivityType, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { RecordStaffActivityDto, StaffPerformancePeriod, StaffPerformanceQueryDto } from './dto';
import { StaffPerformanceRecord } from './interfaces';
import { StaffActivityLog, StaffActivityLogDocument } from './schemas/staff-activity-log.schema';
import { StaffPerformanceDaily, StaffPerformanceDailyDocument } from './schemas/staff-performance-daily.schema';
import { StaffPerformanceMonthly, StaffPerformanceMonthlyDocument } from './schemas/staff-performance-monthly.schema';
import { StaffPerformanceWeekly, StaffPerformanceWeeklyDocument } from './schemas/staff-performance-weekly.schema';
import { StaffPerformanceYearly, StaffPerformanceYearlyDocument } from './schemas/staff-performance-yearly.schema';

@Injectable()
export class StaffActivityService {
  constructor(
    @InjectModel(StaffActivityLog.name)
    private readonly staffActivityLogModel: Model<StaffActivityLogDocument>,
    @InjectModel(StaffPerformanceDaily.name)
    private readonly dailyModel: Model<StaffPerformanceDailyDocument>,
    @InjectModel(StaffPerformanceWeekly.name)
    private readonly weeklyModel: Model<StaffPerformanceWeeklyDocument>,
    @InjectModel(StaffPerformanceMonthly.name)
    private readonly monthlyModel: Model<StaffPerformanceMonthlyDocument>,
    @InjectModel(StaffPerformanceYearly.name)
    private readonly yearlyModel: Model<StaffPerformanceYearlyDocument>,
  ) {}

  async recordActivity(dto: RecordStaffActivityDto) {
    const activity = await this.staffActivityLogModel.create({
      staffId: new Types.ObjectId(dto.staffId),
      memberId: dto.memberId ? new Types.ObjectId(dto.memberId) : undefined,
      branchId: new Types.ObjectId(dto.branchId),
      districtId: new Types.ObjectId(dto.districtId),
      activityType: dto.activityType,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId ? new Types.ObjectId(dto.referenceId) : undefined,
      amount: dto.amount ?? 0,
      createdAt: dto.createdAt,
      updatedAt: dto.createdAt,
    });

    return {
      id: activity._id.toString(),
      activityType: activity.activityType,
    };
  }

  async buildSummary(
    currentUser: AuthenticatedUser,
    query: StaffPerformanceQueryDto,
  ): Promise<StaffPerformanceRecord[]> {
    this.ensureManagerAccess(currentUser);

    const targetDate = query.date ? new Date(query.date) : new Date();
    const periodStart = this.resolvePeriodStart(query.period, targetDate);
    const periodEnd = this.resolvePeriodEnd(query.period, targetDate);

    const match: Record<string, unknown> = {
      createdAt: {
        $gte: periodStart,
        $lt: periodEnd,
      },
    };

    if (query.staffId) {
      match.staffId = new Types.ObjectId(query.staffId);
    }
    if (query.branchId) {
      match.branchId = new Types.ObjectId(query.branchId);
    } else if (currentUser.branchId && currentUser.role === UserRole.BRANCH_MANAGER) {
      match.branchId = new Types.ObjectId(currentUser.branchId);
    }
    if (query.districtId) {
      match.districtId = new Types.ObjectId(query.districtId);
    } else if (
      currentUser.districtId &&
      (currentUser.role === UserRole.DISTRICT_MANAGER ||
        currentUser.role === UserRole.DISTRICT_OFFICER)
    ) {
      match.districtId = new Types.ObjectId(currentUser.districtId);
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: {
            staffId: '$staffId',
            branchId: '$branchId',
            districtId: '$districtId',
          },
          customersHelped: {
            $sum: {
              $cond: [{ $eq: ['$activityType', ActivityType.CUSTOMER_HELPED] }, 1, 0],
            },
          },
          transactionsCount: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$activityType',
                    [
                      ActivityType.DEPOSIT,
                      ActivityType.WITHDRAWAL,
                      ActivityType.TRANSFER,
                      ActivityType.SCHOOL_PAYMENT,
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
          loanApplicationsCount: {
            $sum: {
              $cond: [{ $eq: ['$activityType', ActivityType.LOAN_CREATED] }, 1, 0],
            },
          },
          loanApprovedCount: {
            $sum: {
              $cond: [{ $eq: ['$activityType', ActivityType.LOAN_APPROVED] }, 1, 0],
            },
          },
          loanRejectedCount: {
            $sum: {
              $cond: [{ $eq: ['$activityType', ActivityType.LOAN_REJECTED] }, 1, 0],
            },
          },
          schoolPaymentsCount: {
            $sum: {
              $cond: [{ $eq: ['$activityType', ActivityType.SCHOOL_PAYMENT] }, 1, 0],
            },
          },
          totalTransactionAmount: { $sum: '$amount' },
        },
      },
      {
        $project: {
          _id: 0,
          staffId: '$_id.staffId',
          branchId: '$_id.branchId',
          districtId: '$_id.districtId',
          periodStart: { $literal: periodStart },
          customersHelped: 1,
          transactionsCount: 1,
          loanApplicationsCount: 1,
          loanApprovedCount: 1,
          loanRejectedCount: 1,
          schoolPaymentsCount: 1,
          totalTransactionAmount: 1,
        },
      },
    ];

    const summary = await this.staffActivityLogModel.aggregate<StaffPerformanceRecord>(pipeline);
    await this.persistSummary(query.period, summary);

    return summary.map((item) => ({
      ...item,
      staffId: item.staffId.toString(),
      branchId: item.branchId.toString(),
      districtId: item.districtId.toString(),
    }));
  }

  private async persistSummary(
    period: StaffPerformancePeriod,
    records: StaffPerformanceRecord[],
  ) {
    const model = this.resolvePerformanceModel(period);

    await Promise.all(
      records.map((record) =>
        model.findOneAndUpdate(
          {
            staffId: new Types.ObjectId(record.staffId),
            periodStart: record.periodStart,
          },
          {
            $set: {
              staffId: new Types.ObjectId(record.staffId),
              branchId: new Types.ObjectId(record.branchId),
              districtId: new Types.ObjectId(record.districtId),
              periodStart: record.periodStart,
              customersHelped: record.customersHelped,
              transactionsCount: record.transactionsCount,
              loanApplicationsCount: record.loanApplicationsCount,
              loanApprovedCount: record.loanApprovedCount,
              loanRejectedCount: record.loanRejectedCount,
              schoolPaymentsCount: record.schoolPaymentsCount,
              totalTransactionAmount: record.totalTransactionAmount,
            },
          },
          { upsert: true, new: true },
        ),
      ),
    );
  }

  private resolvePerformanceModel(period: StaffPerformancePeriod) {
    switch (period) {
      case StaffPerformancePeriod.DAILY:
        return this.dailyModel;
      case StaffPerformancePeriod.WEEKLY:
        return this.weeklyModel;
      case StaffPerformancePeriod.MONTHLY:
        return this.monthlyModel;
      case StaffPerformancePeriod.YEARLY:
        return this.yearlyModel;
    }
  }

  private resolvePeriodStart(period: StaffPerformancePeriod, date: Date): Date {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);

    switch (period) {
      case StaffPerformancePeriod.DAILY:
        return base;
      case StaffPerformancePeriod.WEEKLY: {
        const day = base.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        base.setDate(base.getDate() + diff);
        return base;
      }
      case StaffPerformancePeriod.MONTHLY:
        base.setDate(1);
        return base;
      case StaffPerformancePeriod.YEARLY:
        base.setMonth(0, 1);
        return base;
    }
  }

  private resolvePeriodEnd(period: StaffPerformancePeriod, date: Date): Date {
    const start = this.resolvePeriodStart(period, date);
    const end = new Date(start);

    switch (period) {
      case StaffPerformancePeriod.DAILY:
        end.setDate(end.getDate() + 1);
        break;
      case StaffPerformancePeriod.WEEKLY:
        end.setDate(end.getDate() + 7);
        break;
      case StaffPerformancePeriod.MONTHLY:
        end.setMonth(end.getMonth() + 1);
        break;
      case StaffPerformancePeriod.YEARLY:
        end.setFullYear(end.getFullYear() + 1);
        break;
    }

    return end;
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
      throw new ForbiddenException('Only manager and admin roles can view staff performance.');
    }
  }
}
