import { recommendationRules } from './recommendation.rules';
import { RecommendationContext } from './interfaces';

const baseContext = (): RecommendationContext => ({
  member: {
    id: '65f1b5f27d27c9e2cba10001',
    customerId: 'BUN-100001',
    fullName: 'Abebe Kebede',
    firstName: 'Abebe',
    branchId: '65f1b5f27d27c9e2cba20001',
    districtId: '65f1b5f27d27c9e2cba30001',
    kycStatus: 'verified',
    shareBalance: 0,
  },
  profile: {
    membershipStatus: 'active',
    identityVerificationStatus: 'verified',
  },
  identityVerification: {
    verificationStatus: 'verified',
  },
  savings: {
    accountsCount: 1,
    totalBalance: 120000,
    averageBalance: 120000,
    hasActiveSavings: true,
  },
  transactions: {
    totalCount: 7,
    mobileCount: 5,
    branchCount: 2,
    manualPaymentCount: 0,
    loanRepaymentCount: 2,
    depositCount: 3,
    depositMonths: 3,
    averageDepositAmount: 12000,
  },
  loans: {
    totalCount: 1,
    activeCount: 0,
    approvedOrDisbursedCount: 1,
    closedCount: 1,
    hasGoodRepaymentSignal: true,
    hasRepaymentWithoutAutopay: false,
  },
  insurance: {
    activePoliciesCount: 1,
    expiringSoon: false,
  },
  services: {
    autopayEnabled: true,
    hasAtmCard: false,
    branchHeavyUsage: false,
    hasUnreadNotifications: false,
  },
  support: {
    recentOpenChats: 0,
    recentChats: 0,
    needsFollowup: false,
  },
  segment: 'active',
  now: new Date('2026-03-15T12:00:00.000Z'),
});

describe('recommendationRules', () => {
  it('emits savings, loan top-up, and card recommendations from a strong profile', () => {
    const context = baseContext();

    const drafts = recommendationRules.flatMap((rule) => rule.evaluate(context));
    const types = drafts.map((item) => `${item.audienceType}:${item.type}`);

    expect(types).toContain('customer:savings_plan');
    expect(types).toContain('customer:loan_topup');
    expect(types).toContain('customer:card_order');
    expect(types).toContain('staff:customer_followup');
  });

  it('emits KYC and autopay guidance when verification is incomplete and manual payments repeat', () => {
    const context = baseContext();
    context.member.kycStatus = 'pending_review';
    context.profile = {
      membershipStatus: 'pending_verification',
      identityVerificationStatus: 'pending_review',
    };
    context.identityVerification = {
      verificationStatus: 'pending_review',
    };
    context.services.autopayEnabled = false;
    context.transactions.manualPaymentCount = 3;

    const drafts = recommendationRules.flatMap((rule) => rule.evaluate(context));
    const customerTitles = drafts
      .filter((item) => item.audienceType === 'customer')
      .map((item) => item.title);

    expect(customerTitles).toContain('Complete Fayda Verification');
    expect(customerTitles).toContain('Set Up AutoPay');
  });
});
