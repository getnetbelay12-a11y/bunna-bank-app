import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriodQueryDto } from './dto';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").ManagerDashboardSummary>;
    getBranchPerformance(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceSummaryItem[]>;
    getDistrictPerformance(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceSummaryItem[]>;
    getStaffRanking(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").StaffRankingItem[]>;
    getVotingSummary(currentUser: AuthenticatedUser): Promise<import("./interfaces").VotingSummaryItem[]>;
}
