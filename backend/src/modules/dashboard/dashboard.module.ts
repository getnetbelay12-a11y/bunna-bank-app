import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Loan, LoanSchema } from '../loans/schemas/loan.schema';
import { Branch, BranchSchema } from '../members/schemas/branch.schema';
import { District, DistrictSchema } from '../members/schemas/district.schema';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { Staff, StaffSchema } from '../staff/schemas/staff.schema';
import { BranchPerformanceDaily, BranchPerformanceDailySchema } from '../staff-activity/schemas/branch-performance-daily.schema';
import { DistrictPerformanceDaily, DistrictPerformanceDailySchema } from '../staff-activity/schemas/district-performance-daily.schema';
import { SchoolPayment, SchoolPaymentSchema } from '../payments/schemas/school-payment.schema';
import { StaffPerformanceDaily, StaffPerformanceDailySchema } from '../staff-activity/schemas/staff-performance-daily.schema';
import { StaffPerformanceMonthly, StaffPerformanceMonthlySchema } from '../staff-activity/schemas/staff-performance-monthly.schema';
import { StaffPerformanceWeekly, StaffPerformanceWeeklySchema } from '../staff-activity/schemas/staff-performance-weekly.schema';
import { StaffPerformanceYearly, StaffPerformanceYearlySchema } from '../staff-activity/schemas/staff-performance-yearly.schema';
import { VoteResponse, VoteResponseSchema } from '../voting/schemas/vote-response.schema';
import { Vote, VoteSchema } from '../voting/schemas/vote.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ManagerPerformanceController } from './manager-performance.controller';
import { ManagerPerformanceService } from './manager-performance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Loan.name, schema: LoanSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: District.name, schema: DistrictSchema },
      { name: SchoolPayment.name, schema: SchoolPaymentSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: BranchPerformanceDaily.name, schema: BranchPerformanceDailySchema },
      { name: DistrictPerformanceDaily.name, schema: DistrictPerformanceDailySchema },
      { name: StaffPerformanceDaily.name, schema: StaffPerformanceDailySchema },
      { name: StaffPerformanceWeekly.name, schema: StaffPerformanceWeeklySchema },
      { name: StaffPerformanceMonthly.name, schema: StaffPerformanceMonthlySchema },
      { name: StaffPerformanceYearly.name, schema: StaffPerformanceYearlySchema },
      { name: Vote.name, schema: VoteSchema },
      { name: VoteResponse.name, schema: VoteResponseSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [DashboardController, ManagerPerformanceController],
  providers: [DashboardService, ManagerPerformanceService],
  exports: [DashboardService, ManagerPerformanceService],
})
export class DashboardModule {}
