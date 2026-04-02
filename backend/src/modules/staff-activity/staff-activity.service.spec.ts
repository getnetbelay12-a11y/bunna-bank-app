import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

import { ActivityType, UserRole } from '../../common/enums';
import { StaffActivityService } from './staff-activity.service';
import { StaffPerformancePeriod } from './dto';

describe('StaffActivityService', () => {
  let logModel: { create: jest.Mock; aggregate: jest.Mock };
  let dailyModel: { findOneAndUpdate: jest.Mock };
  let weeklyModel: { findOneAndUpdate: jest.Mock };
  let monthlyModel: { findOneAndUpdate: jest.Mock };
  let yearlyModel: { findOneAndUpdate: jest.Mock };
  let service: StaffActivityService;

  beforeEach(() => {
    logModel = { create: jest.fn(), aggregate: jest.fn() };
    dailyModel = { findOneAndUpdate: jest.fn().mockResolvedValue(undefined) };
    weeklyModel = { findOneAndUpdate: jest.fn().mockResolvedValue(undefined) };
    monthlyModel = { findOneAndUpdate: jest.fn().mockResolvedValue(undefined) };
    yearlyModel = { findOneAndUpdate: jest.fn().mockResolvedValue(undefined) };

    service = new StaffActivityService(
      logModel as never,
      dailyModel as never,
      weeklyModel as never,
      monthlyModel as never,
      yearlyModel as never,
    );
  });

  it('records a major staff activity', async () => {
    const id = new Types.ObjectId();
    logModel.create.mockResolvedValue({ _id: id, activityType: ActivityType.LOAN_APPROVED });

    const result = await service.recordActivity({
      staffId: new Types.ObjectId().toString(),
      branchId: new Types.ObjectId().toString(),
      districtId: new Types.ObjectId().toString(),
      activityType: ActivityType.LOAN_APPROVED,
      amount: 120000,
    });

    expect(logModel.create).toHaveBeenCalled();
    expect(result).toEqual({
      id: id.toString(),
      activityType: ActivityType.LOAN_APPROVED,
    });
  });

  it('builds and persists daily performance summary', async () => {
    logModel.aggregate.mockResolvedValue([
      {
        staffId: new Types.ObjectId(),
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
        periodStart: new Date('2026-03-09T00:00:00.000Z'),
        customersHelped: 5,
        transactionsCount: 3,
        loanApplicationsCount: 2,
        loanApprovedCount: 1,
        loanRejectedCount: 0,
        schoolPaymentsCount: 1,
        totalTransactionAmount: 4500,
      },
    ]);

    const result = await service.buildSummary(
      { sub: 'staff_1', role: UserRole.ADMIN },
      { period: StaffPerformancePeriod.DAILY },
    );

    expect(logModel.aggregate).toHaveBeenCalled();
    expect(dailyModel.findOneAndUpdate).toHaveBeenCalled();
    expect(result[0]).toEqual(
      expect.objectContaining({
        customersHelped: 5,
        loanApprovedCount: 1,
        totalTransactionAmount: 4500,
      }),
    );
  });

  it('rejects non-manager access to performance summaries', async () => {
    await expect(
      service.buildSummary(
        { sub: 'member_1', role: UserRole.MEMBER },
        { period: StaffPerformancePeriod.WEEKLY },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
