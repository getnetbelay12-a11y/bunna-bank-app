export interface ManagerDashboardSummary {
    customersServed: number;
    transactionsCount: number;
    schoolPaymentsCount: number;
    pendingLoansByLevel: Array<{
        level: string;
        count: number;
    }>;
}
export interface PerformanceSummaryItem {
    scopeId: string;
    customersServed: number;
    transactionsCount: number;
    loanApprovedCount: number;
    loanRejectedCount: number;
    schoolPaymentsCount: number;
    totalTransactionAmount: number;
}
export interface StaffRankingItem {
    staffId: string;
    branchId: string;
    districtId: string;
    score: number;
    customersServed: number;
    transactionsCount: number;
    loanApprovedCount: number;
    schoolPaymentsCount: number;
}
export interface VotingSummaryItem {
    voteId: string;
    title: string;
    totalResponses: number;
    eligibleShareholders: number;
    participationRate: number;
}
