import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriodQueryDto } from '../dashboard/dto';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getManagerSnapshot(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<{
        generatedAt: Date;
        summary: import("../dashboard/interfaces").ManagerDashboardSummary;
        branchPerformance: import("../dashboard/interfaces").PerformanceSummaryItem[];
        districtPerformance: import("../dashboard/interfaces").PerformanceSummaryItem[];
        staffRanking: import("../dashboard/interfaces").StaffRankingItem[];
        votingSummary: import("../dashboard/interfaces").VotingSummaryItem[];
    }>;
}
