export interface ManagerDashboardSummary {
  customersServed: number;
  transactionsCount: number;
  schoolPaymentsCount: number;
  pendingLoansByLevel: Array<{ level: string; count: number }>;
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

export interface OnboardingReviewItem {
  memberId: string;
  customerId: string;
  memberName: string;
  phoneNumber?: string;
  branchId?: string;
  districtId?: string;
  branchName?: string;
  onboardingReviewStatus: string;
  membershipStatus: string;
  identityVerificationStatus: string;
  kycStatus: string;
  requiredAction: string;
  submittedAt?: string;
  updatedAt?: string;
  reviewNote?: string;
}

export interface AutopayOperationItem {
  id: string;
  memberId: string;
  customerId: string;
  memberName: string;
  branchId?: string;
  districtId?: string;
  branchName?: string;
  serviceType: string;
  accountId: string;
  schedule: string;
  enabled: boolean;
  operationalStatus: 'active' | 'paused';
  actionRequired: string;
  updatedAt?: string;
}
