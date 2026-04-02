export declare enum StaffPerformancePeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly"
}
export declare class StaffPerformanceQueryDto {
    period: StaffPerformancePeriod;
    staffId?: string;
    branchId?: string;
    districtId?: string;
    date?: string;
}
