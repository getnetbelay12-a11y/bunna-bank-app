export type LoanQueueAction =
  | 'review'
  | 'forward'
  | 'approve'
  | 'return_for_correction';

export interface LoanQueueItem {
  loanId: string;
  memberId: string;
  customerId: string;
  memberName: string;
  amount: number;
  level: string;
  status: string;
  branchId?: string;
  districtId?: string;
  deficiencyReasons: string[];
  availableActions: LoanQueueAction[];
  updatedAt?: string;
}

export interface LoanWorkflowTimelineEntry {
  action: string;
  level: string;
  fromStatus: string;
  toStatus: string;
  actorRole?: string;
  comment?: string;
  createdAt?: string;
}

export interface LoanQueueDetail extends LoanQueueItem {
  nextAction: string;
  availableActions: LoanQueueAction[];
  history: LoanWorkflowTimelineEntry[];
}

export interface LoanCustomerProfile {
  memberId: string;
  customerId: string;
  memberName: string;
  branchId?: string;
  districtId?: string;
  activeLoans: number;
  closedLoans: number;
  rejectedLoans: number;
  totalLoanCount: number;
  totalBorrowedAmount: number;
  totalClosedAmount: number;
  repaymentCount90d: number;
  lastRepaymentAt?: string;
  autopayEnabled: boolean;
  autopayServices: string[];
  repaymentSignal: 'strong' | 'steady' | 'watch';
  loyaltyTier: 'gold' | 'silver' | 'watch';
  nextBestAction: string;
  offerCue: string;
  openSupportCases: number;
  activeLoanStatuses: string[];
}
