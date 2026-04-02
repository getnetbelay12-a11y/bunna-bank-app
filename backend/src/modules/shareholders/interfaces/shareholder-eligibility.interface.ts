export interface ShareholderEligibility {
  memberId: string;
  isShareholder: boolean;
  canVote: boolean;
  isActive: boolean;
  shareBalance: number;
  reason: string;
}
