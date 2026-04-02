export declare enum DashboardPeriod {
    TODAY = "today",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year"
}
export declare class DashboardPeriodQueryDto {
    period?: DashboardPeriod;
    date?: string;
}
