export type PerformanceStatus = 'excellent' | 'good' | 'watch' | 'needs_support';
export type PerformanceEntityType = 'district' | 'branch' | 'employee';
export interface PerformanceEntityMetrics {
    membersServed: number;
    customersHelped: number;
    loansHandled: number;
    loansApproved: number;
    loansEscalated: number;
    kycCompleted: number;
    supportResolved: number;
    transactionsProcessed: number;
    avgHandlingTime: number;
    pendingTasks: number;
    pendingApprovals: number;
    responseTimeMinutes: number;
    score: number;
    status: PerformanceStatus;
}
export interface PerformanceEntityItem extends PerformanceEntityMetrics {
    entityId: string;
    entityType: PerformanceEntityType;
    name: string;
    districtId?: string;
    districtName?: string;
    branchId?: string;
    branchName?: string;
    role?: string;
}
export interface PerformanceOverviewResponse {
    scope: PerformanceEntityType;
    period: 'today' | 'week' | 'month' | 'year';
    generatedAt: string;
    kpis: PerformanceEntityMetrics;
    items: PerformanceEntityItem[];
}
