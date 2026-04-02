import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriodQueryDto } from '../dashboard/dto';
import { DashboardService } from '../dashboard/dashboard.service';
export declare class ReportsService {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getManagerReportSnapshot(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<{
        generatedAt: Date;
        summary: import("../dashboard/interfaces").ManagerDashboardSummary;
        branchPerformance: import("../dashboard/interfaces").PerformanceSummaryItem[];
        districtPerformance: import("../dashboard/interfaces").PerformanceSummaryItem[];
        staffRanking: import("../dashboard/interfaces").StaffRankingItem[];
        votingSummary: import("../dashboard/interfaces").VotingSummaryItem[];
    }>;
}
