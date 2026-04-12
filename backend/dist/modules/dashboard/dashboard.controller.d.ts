import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriodQueryDto, UpdateAutopayOperationDto, UpdateOnboardingReviewDto } from './dto';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").ManagerDashboardSummary>;
    getBranchPerformance(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceSummaryItem[]>;
    getDistrictPerformance(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceSummaryItem[]>;
    getStaffRanking(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").StaffRankingItem[]>;
    getVotingSummary(currentUser: AuthenticatedUser): Promise<import("./interfaces").VotingSummaryItem[]>;
    getOnboardingReviewQueue(currentUser: AuthenticatedUser): Promise<import("./interfaces").OnboardingReviewItem[]>;
    getOnboardingEvidenceDetail(currentUser: AuthenticatedUser, memberId: string): Promise<import("./interfaces").OnboardingEvidenceDetail>;
    getAutopayOperations(currentUser: AuthenticatedUser): Promise<import("./interfaces").AutopayOperationItem[]>;
    updateAutopayOperation(currentUser: AuthenticatedUser, id: string, dto: UpdateAutopayOperationDto): Promise<import("./interfaces").AutopayOperationItem>;
    updateOnboardingReview(currentUser: AuthenticatedUser, memberId: string, dto: UpdateOnboardingReviewDto): Promise<import("./interfaces").OnboardingReviewItem>;
}
