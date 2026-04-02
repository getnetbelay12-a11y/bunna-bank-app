export interface TransactionHistoryItem {
  _id: string;
  transactionReference: string;
  memberId: string;
  accountId: string;
  branchId: string;
  type: string;
  channel: 'mobile' | 'branch';
  amount: number;
  currency: string;
  externalReference?: string;
  narration?: string;
  createdAt?: Date;
}
