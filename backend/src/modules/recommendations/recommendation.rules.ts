import {
  RECOMMENDATION_ACTION_ROUTES,
  RECOMMENDATION_THRESHOLDS,
} from './recommendation.constants';
import { RecommendationContext, RecommendationDraft, RecommendationRule } from './interfaces';

const daysFromNow = (date: Date, now: Date) =>
  Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

const buildDraft = (
  base: Omit<RecommendationDraft, 'source'>,
): RecommendationDraft => ({
  source: 'rules',
  ...base,
});

export const recommendationRules: RecommendationRule[] = [
  {
    id: 'customer-kyc-completion',
    evaluate: (context) => {
      const incomplete =
        context.member.kycStatus !== 'verified' ||
        context.profile?.identityVerificationStatus !== 'verified' ||
        context.identityVerification?.verificationStatus !== 'verified';

      if (!incomplete) {
        return [];
      }

      return [
        buildDraft({
          audienceType: 'customer',
          type: 'kyc_completion',
          title: 'Complete Fayda Verification',
          description:
            'Finish verification to unlock more services and smoother account access.',
          reason:
            'Your profile still has a pending verification step.',
          actionLabel: 'Complete now',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.kyc,
          score: 0.96,
          priority: 95,
          badge: 'Complete now',
          metadata: {
            missingStep: 'identity_verification',
          },
        }),
        buildDraft({
          audienceType: 'staff',
          type: 'service_completion',
          title: 'Follow Up on KYC Completion',
          description:
            'Customer access can improve after Fayda and profile verification are completed.',
          reason:
            'KYC remains incomplete and may block higher-value service activation.',
          actionLabel: 'Review customer profile',
          actionRoute: `${RECOMMENDATION_ACTION_ROUTES.staffCustomerDetail}/${context.member.id}`,
          score: 0.94,
          priority: 94,
          badge: 'Action needed',
          metadata: {
            nextBestAction: 'verify_kyc_status',
            internalContext: 'Pending KYC / Fayda verification',
          },
        }),
      ];
    },
  },
  {
    id: 'customer-autopay-manual-payments',
    evaluate: (context) => {
      if (
        context.services.autopayEnabled ||
        context.transactions.manualPaymentCount <
          RECOMMENDATION_THRESHOLDS.manualPaymentCountThreshold
      ) {
        return [];
      }

      return [
        buildDraft({
          audienceType: 'customer',
          type: 'autopay_recommendation',
          title: 'Set Up AutoPay',
          description:
            'Automate repeat payments so you do not need to visit a branch each time.',
          reason:
            'We noticed repeated manual payments on your account.',
          actionLabel: 'Set up AutoPay',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.autopay,
          score: 0.88,
          priority: 84,
          badge: 'Recommended',
          metadata: {
            manualPaymentCount: context.transactions.manualPaymentCount,
          },
        }),
        buildDraft({
          audienceType: 'staff',
          type: 'autopay_recommendation',
          title: 'Offer AutoPay Enrollment',
          description:
            'Customer is still making repeated manual payments that could move to AutoPay.',
          reason:
            'Repeated branch or manual payment behavior indicates automation opportunity.',
          actionLabel: 'Open support guidance',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.staffSupportQueue,
          score: 0.86,
          priority: 82,
          badge: 'Opportunity',
          metadata: {
            nextBestAction: 'autopay_enrollment_outreach',
          },
        }),
      ];
    },
  },
  {
    id: 'customer-loan-topup',
    evaluate: (context) => {
      if (!context.loans.hasGoodRepaymentSignal) {
        return [];
      }

      return [
        buildDraft({
          audienceType: 'customer',
          type: 'loan_topup',
          title: 'You May Be Eligible for a Loan Review',
          description:
            'Based on your recent account and repayment activity, consider exploring a top-up or new loan option.',
          reason:
            'Your repayment pattern looks strong and no overdue signal was found.',
          actionLabel: 'View loan options',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.loanTopup,
          score: 0.84,
          priority: 80,
          badge: 'Opportunity',
          metadata: {
            likelyEligible: true,
          },
          expiresAt: new Date(
            context.now.getTime() +
              RECOMMENDATION_THRESHOLDS.longExpiryDays * 24 * 60 * 60 * 1000,
          ),
        }),
        buildDraft({
          audienceType: 'staff',
          type: 'customer_followup',
          title: 'Review for Loan Top-Up Opportunity',
          description:
            'Customer shows strong repayment behavior and may be suitable for a pre-approved review.',
          reason:
            'Repayment signals are strong and the customer has existing credit history.',
          actionLabel: 'Open loan workflow',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.staffLoanWorkflow,
          score: 0.85,
          priority: 81,
          badge: 'High relevance',
          metadata: {
            nextBestAction: 'loan_topup_review',
            eligibilityNote: 'Use likely eligible language only. No guaranteed approval.',
          },
        }),
      ];
    },
  },
  {
    id: 'customer-savings-plan',
    evaluate: (context) => {
      const qualifies =
        context.savings.totalBalance >=
          RECOMMENDATION_THRESHOLDS.stableBalanceThreshold &&
        context.transactions.depositMonths >=
          RECOMMENDATION_THRESHOLDS.stableBalanceDepositMonths;

      if (!qualifies) {
        return [];
      }

      return [
        buildDraft({
          audienceType: 'customer',
          type: 'savings_plan',
          title: 'Open a Savings Plan',
          description:
            'You have maintained a healthy balance. Consider moving part of it into a goal-based savings plan.',
          reason:
            'Your account balance and deposit pattern have been stable over recent months.',
          actionLabel: 'Explore savings plans',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.savingsPlan,
          score: 0.83,
          priority: 78,
          badge: 'Recommended',
          metadata: {
            averageBalance: context.savings.averageBalance,
          },
        }),
        buildDraft({
          audienceType: 'staff',
          type: 'product_recommendation',
          title: 'Present Savings Growth Option',
          description:
            'Customer maintains a stable positive balance and may respond well to a savings or fixed deposit discussion.',
          reason:
            'Stable balances and repeat deposits indicate savings product readiness.',
          actionLabel: 'Open relationship follow-up',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.staffRelationshipFollowup,
          score: 0.8,
          priority: 76,
          badge: 'Opportunity',
          metadata: {
            nextBestAction: 'offer_savings_plan',
          },
        }),
      ];
    },
  },
  {
    id: 'customer-card-order',
    evaluate: (context) => {
      if (context.services.hasAtmCard) {
        return [];
      }

      return [
        buildDraft({
          audienceType: 'customer',
          type: 'card_order',
          title: 'Order Your ATM Card',
          description:
            'Get easier access to your account for withdrawals and day-to-day banking.',
          reason:
            'We could not find an ATM card request on your account.',
          actionLabel: 'Order ATM card',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.atmCard,
          score: 0.76,
          priority: 74,
          badge: 'Action needed',
        }),
        buildDraft({
          audienceType: 'staff',
          type: 'service_completion',
          title: 'ATM Card Service Still Missing',
          description:
            'Customer has an active account but no recorded ATM card request.',
          reason:
            'Card setup remains incomplete and may affect daily banking convenience.',
          actionLabel: 'Open customer profile',
          actionRoute: `${RECOMMENDATION_ACTION_ROUTES.staffCustomerDetail}/${context.member.id}`,
          score: 0.72,
          priority: 70,
          badge: 'Recommended',
          metadata: {
            nextBestAction: 'offer_atm_card_request',
          },
        }),
      ];
    },
  },
  {
    id: 'customer-insurance-renewal',
    evaluate: (context) => {
      if (!context.insurance.expiringSoon || !context.insurance.nearestExpiryAt) {
        return [];
      }

      const daysLeft = daysFromNow(context.insurance.nearestExpiryAt, context.now);

      return [
        buildDraft({
          audienceType: 'customer',
          type: 'insurance_renewal',
          title: 'Renew Your Insurance',
          description:
            'Your current insurance policy is approaching renewal. Review it now to avoid interruption.',
          reason: `Your policy is due within ${daysLeft} days.`,
          actionLabel: 'Renew now',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.insuranceRenewal,
          score: 0.92,
          priority: 90,
          badge: 'Action needed',
          expiresAt: context.insurance.nearestExpiryAt,
        }),
        buildDraft({
          audienceType: 'staff',
          type: 'insurance_renewal',
          title: 'Insurance Renewal Follow-Up Needed',
          description:
            'A customer policy is near expiry and may require proactive outreach.',
          reason: `Nearest policy expiry is within ${daysLeft} days.`,
          actionLabel: 'Review renewal',
          actionRoute: `${RECOMMENDATION_ACTION_ROUTES.staffCustomerDetail}/${context.member.id}`,
          score: 0.9,
          priority: 88,
          badge: 'Action needed',
          expiresAt: context.insurance.nearestExpiryAt,
          metadata: {
            nextBestAction: 'renewal_outreach',
          },
        }),
      ];
    },
  },
  {
    id: 'customer-repayment-support',
    evaluate: (context) => {
      if (!context.loans.hasRepaymentWithoutAutopay || context.services.autopayEnabled) {
        return [];
      }

      return [
        buildDraft({
          audienceType: 'customer',
          type: 'repayment_support',
          title: 'Make Loan Repayments Easier',
          description:
            'Consider AutoPay or reminders to stay on top of loan repayments with less manual work.',
          reason:
            'You have repayment activity but no AutoPay setup was found.',
          actionLabel: 'Set repayment support',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.autopay,
          score: 0.82,
          priority: 79,
          badge: 'Recommended',
        }),
        buildDraft({
          audienceType: 'staff',
          type: 'repayment_support',
          title: 'Offer Repayment Support Setup',
          description:
            'Customer has loan repayment activity without payment automation.',
          reason:
            'Autopay or reminders could reduce repayment friction and service workload.',
          actionLabel: 'Contact customer',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.staffRelationshipFollowup,
          score: 0.8,
          priority: 77,
          badge: 'Recommended',
          metadata: {
            nextBestAction: 'offer_repayment_autopay',
          },
        }),
      ];
    },
  },
  {
    id: 'customer-digital-migration',
    evaluate: (context) => {
      if (!context.services.branchHeavyUsage) {
        return [];
      }

      return [
        buildDraft({
          audienceType: 'customer',
          type: 'digital_migration',
          title: 'Activate Digital Payments',
          description:
            'Use the app for everyday payments and transfers instead of branch visits.',
          reason:
            'Many of your recent basic transactions were completed manually or at a branch.',
          actionLabel: 'Try digital features',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.digitalPayments,
          score: 0.74,
          priority: 68,
          badge: 'Opportunity',
        }),
        buildDraft({
          audienceType: 'staff',
          type: 'customer_followup',
          title: 'Guide Customer to Digital Self-Service',
          description:
            'This customer still relies on branch interactions for repeat basic actions.',
          reason:
            'Recent transaction behavior suggests a branch-to-digital migration opportunity.',
          actionLabel: 'Open support guidance',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.staffSupportQueue,
          score: 0.73,
          priority: 67,
          badge: 'Opportunity',
          metadata: {
            nextBestAction: 'digital_migration_guidance',
          },
        }),
      ];
    },
  },
  {
    id: 'staff-high-value-followup',
    evaluate: (context) => {
      if (context.segment !== 'premium') {
        return [];
      }

      return [
        buildDraft({
          audienceType: 'staff',
          type: 'customer_followup',
          title: 'High-Value Relationship Follow-Up',
          description:
            'Customer activity and balances suggest a premium servicing opportunity.',
          reason:
            'High average balances or shareholder exposure place this customer in a premium segment.',
          actionLabel: 'Open relationship view',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.staffRelationshipFollowup,
          score: 0.78,
          priority: 73,
          badge: 'High relevance',
          metadata: {
            nextBestAction: 'premium_relationship_followup',
          },
        }),
      ];
    },
  },
  {
    id: 'support-followup',
    evaluate: (context) => {
      if (!context.support.needsFollowup) {
        return [];
      }

      return [
        buildDraft({
          audienceType: 'customer',
          type: 'service_completion',
          title: 'Update Your Support Setup',
          description:
            'We can help you finish the next step faster from the app or with guided assistance.',
          reason:
            'Recent support conversations suggest you may benefit from guided setup.',
          actionLabel: 'Open support',
          actionRoute: '/support/chats',
          score: 0.71,
          priority: 66,
          badge: 'Recommended',
        }),
        buildDraft({
          audienceType: 'staff',
          type: 'customer_followup',
          title: 'Customer Follow-Up Recommended',
          description:
            'Recent support activity indicates unresolved friction or repeated confusion.',
          reason:
            'Chat volume or open conversations suggest a guided next step is needed.',
          actionLabel: 'Open support queue',
          actionRoute: RECOMMENDATION_ACTION_ROUTES.staffSupportQueue,
          score: 0.79,
          priority: 75,
          badge: 'Action needed',
          metadata: {
            nextBestAction: 'guided_followup',
            riskNote: context.support.recentOpenChats > 0 ? 'Active support conversation open.' : undefined,
          },
        }),
      ];
    },
  },
];
