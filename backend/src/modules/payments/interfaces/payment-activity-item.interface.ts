export interface PaymentActivityItem {
  memberId: string;
  customerId: string;
  memberName: string;
  phone?: string;
  branchName?: string;
  openCases: number;
  totalReceipts: number;
  qrPayments: number;
  schoolPayments: number;
  disputeReceipts: number;
  latestActivityAt?: Date;
}
