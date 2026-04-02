import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriodQueryDto } from './dto';
import { ManagerPerformanceService } from './manager-performance.service';
export declare class ManagerPerformanceController {
    private readonly managerPerformanceService;
    constructor(managerPerformanceService: ManagerPerformanceService);
    getHeadOfficeDistrictSummary(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceOverviewResponse>;
    getHeadOfficeTopDistricts(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceEntityItem[]>;
    getHeadOfficeDistrictWatchlist(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceEntityItem[]>;
    getDistrictBranchSummary(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceOverviewResponse>;
    getDistrictTopBranches(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceEntityItem[]>;
    getDistrictBranchWatchlist(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceEntityItem[]>;
    getBranchEmployeeSummary(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceOverviewResponse>;
    getBranchTopEmployees(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceEntityItem[]>;
    getBranchEmployeeWatchlist(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto): Promise<import("./interfaces").PerformanceEntityItem[]>;
}
