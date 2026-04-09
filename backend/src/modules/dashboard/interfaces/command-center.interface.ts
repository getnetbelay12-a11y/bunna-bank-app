import { PerformanceEntityItem, PerformanceOverviewResponse } from './manager-performance.interface';

export interface CommandCenterSupportOverview {
  openChats: number;
  assignedChats: number;
  resolvedChats: number;
  escalatedChats: number;
}

export interface CommandCenterRiskSummary {
  totalAlerts: number;
  loanAlerts: number;
  kycAlerts: number;
  supportAlerts: number;
  notificationAlerts: number;
}

export interface GovernanceStatusSummary {
  activeVotes: number;
  draftVotes: number;
  publishedVotes: number;
  shareholderAnnouncements: number;
}

export interface HeadOfficeCommandCenterSummary {
  totalCustomers: number;
  totalShareholders: number;
  totalSavings: number;
  totalLoans: number;
  pendingApprovals: number;
  riskAlerts: CommandCenterRiskSummary;
  districtPerformance: PerformanceOverviewResponse;
  supportOverview: CommandCenterSupportOverview;
  governanceStatus: GovernanceStatusSummary;
}

export interface DistrictCommandCenterSummary {
  branchList: PerformanceEntityItem[];
  branchRanking: PerformanceEntityItem[];
  loanApprovalsPerBranch: Array<{
    branchId: string;
    branchName: string;
    approvedCount: number;
  }>;
  kycCompletion: {
    completed: number;
    pendingReview: number;
    needsAction: number;
    completionRate: number;
  };
  supportMetrics: CommandCenterSupportOverview;
}

export interface BranchCommandCenterSummary {
  employeePerformance: PerformanceOverviewResponse;
  loansHandled: number;
  kycCompleted: number;
  supportHandled: number;
  pendingTasks: number;
}
