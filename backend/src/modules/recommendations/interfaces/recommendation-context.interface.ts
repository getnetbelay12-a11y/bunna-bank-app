import { Types } from 'mongoose';

import { RecommendationAudience, RecommendationBadge, RecommendationType } from '../recommendation.constants';

export interface RecommendationContext {
  member: {
    id: string;
    customerId: string;
    fullName: string;
    firstName: string;
    branchId: string;
    districtId: string;
    branchName?: string;
    districtName?: string;
    kycStatus: string;
    phone?: string;
    shareBalance: number;
  };
  profile?: {
    membershipStatus: string;
    identityVerificationStatus: string;
  } | null;
  identityVerification?: {
    verificationStatus: string;
    verifiedAt?: Date;
  } | null;
  savings: {
    accountsCount: number;
    totalBalance: number;
    averageBalance: number;
    hasActiveSavings: boolean;
  };
  transactions: {
    totalCount: number;
    mobileCount: number;
    branchCount: number;
    manualPaymentCount: number;
    loanRepaymentCount: number;
    depositCount: number;
    depositMonths: number;
    averageDepositAmount: number;
  };
  loans: {
    totalCount: number;
    activeCount: number;
    approvedOrDisbursedCount: number;
    closedCount: number;
    hasGoodRepaymentSignal: boolean;
    hasRepaymentWithoutAutopay: boolean;
  };
  insurance: {
    activePoliciesCount: number;
    expiringSoon: boolean;
    nearestExpiryAt?: Date;
  };
  services: {
    autopayEnabled: boolean;
    hasAtmCard: boolean;
    branchHeavyUsage: boolean;
    hasUnreadNotifications: boolean;
  };
  support: {
    recentOpenChats: number;
    recentChats: number;
    needsFollowup: boolean;
  };
  segment: 'mass' | 'active' | 'premium';
  now: Date;
}

export interface RecommendationDraft {
  audienceType: RecommendationAudience;
  type: RecommendationType;
  title: string;
  description: string;
  reason: string;
  actionLabel: string;
  actionRoute: string;
  score: number;
  priority: number;
  badge: RecommendationBadge;
  source: 'rules';
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  fingerprintSeed?: string;
}

export interface RecommendationCandidate extends RecommendationDraft {
  memberId: Types.ObjectId;
  customerId: string;
  branchId?: Types.ObjectId;
  districtId?: Types.ObjectId;
  fingerprint: string;
}
