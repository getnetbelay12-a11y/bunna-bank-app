import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StaffActivityController } from './staff-activity.controller';
import { StaffActivityService } from './staff-activity.service';
import { StaffActivityLog, StaffActivityLogSchema } from './schemas/staff-activity-log.schema';
import { StaffPerformanceDaily, StaffPerformanceDailySchema } from './schemas/staff-performance-daily.schema';
import { StaffPerformanceMonthly, StaffPerformanceMonthlySchema } from './schemas/staff-performance-monthly.schema';
import { StaffPerformanceWeekly, StaffPerformanceWeeklySchema } from './schemas/staff-performance-weekly.schema';
import { StaffPerformanceYearly, StaffPerformanceYearlySchema } from './schemas/staff-performance-yearly.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaffActivityLog.name, schema: StaffActivityLogSchema },
      { name: StaffPerformanceDaily.name, schema: StaffPerformanceDailySchema },
      { name: StaffPerformanceWeekly.name, schema: StaffPerformanceWeeklySchema },
      { name: StaffPerformanceMonthly.name, schema: StaffPerformanceMonthlySchema },
      { name: StaffPerformanceYearly.name, schema: StaffPerformanceYearlySchema },
    ]),
  ],
  controllers: [StaffActivityController],
  providers: [StaffActivityService],
  exports: [StaffActivityService],
})
export class StaffActivityModule {}
