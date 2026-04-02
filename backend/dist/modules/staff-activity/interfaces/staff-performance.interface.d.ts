export interface StaffPerformanceRecord {
    staffId: string;
    branchId: string;
    districtId: string;
    periodStart: Date;
    customersHelped: number;
    transactionsCount: number;
    loanApplicationsCount: number;
    loanApprovedCount: number;
    loanRejectedCount: number;
    schoolPaymentsCount: number;
    totalTransactionAmount: number;
}
