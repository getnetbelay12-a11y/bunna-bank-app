import { Model } from 'mongoose';
import { ActivityType } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { RecordStaffActivityDto, StaffPerformanceQueryDto } from './dto';
import { StaffPerformanceRecord } from './interfaces';
import { StaffActivityLogDocument } from './schemas/staff-activity-log.schema';
import { StaffPerformanceDailyDocument } from './schemas/staff-performance-daily.schema';
import { StaffPerformanceMonthlyDocument } from './schemas/staff-performance-monthly.schema';
import { StaffPerformanceWeeklyDocument } from './schemas/staff-performance-weekly.schema';
import { StaffPerformanceYearlyDocument } from './schemas/staff-performance-yearly.schema';
export declare class StaffActivityService {
    private readonly staffActivityLogModel;
    private readonly dailyModel;
    private readonly weeklyModel;
    private readonly monthlyModel;
    private readonly yearlyModel;
    constructor(staffActivityLogModel: Model<StaffActivityLogDocument>, dailyModel: Model<StaffPerformanceDailyDocument>, weeklyModel: Model<StaffPerformanceWeeklyDocument>, monthlyModel: Model<StaffPerformanceMonthlyDocument>, yearlyModel: Model<StaffPerformanceYearlyDocument>);
    recordActivity(dto: RecordStaffActivityDto): Promise<{
        id: string;
        activityType: ActivityType;
    }>;
    buildSummary(currentUser: AuthenticatedUser, query: StaffPerformanceQueryDto): Promise<StaffPerformanceRecord[]>;
    private persistSummary;
    private resolvePerformanceModel;
    private resolvePeriodStart;
    private resolvePeriodEnd;
    private ensureManagerAccess;
}
