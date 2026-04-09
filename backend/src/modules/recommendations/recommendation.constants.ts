export const RECOMMENDATION_AUDIENCES = ['customer', 'staff'] as const;
export type RecommendationAudience = (typeof RECOMMENDATION_AUDIENCES)[number];

export const RECOMMENDATION_TYPES = [
  'product_recommendation',
  'service_completion',
  'autopay_recommendation',
  'insurance_renewal',
  'loan_topup',
  'savings_plan',
  'kyc_completion',
  'card_order',
  'digital_migration',
  'repayment_support',
  'customer_followup',
] as const;
export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export const RECOMMENDATION_BADGES = [
  'High relevance',
  'Recommended',
  'Action needed',
  'Opportunity',
  'Complete now',
] as const;
export type RecommendationBadge = (typeof RECOMMENDATION_BADGES)[number];

export const RECOMMENDATION_SOURCES = ['rules', 'ai', 'manual'] as const;
export type RecommendationSource = (typeof RECOMMENDATION_SOURCES)[number];

export const RECOMMENDATION_STATUSES = [
  'new',
  'viewed',
  'dismissed',
  'acted_on',
  'expired',
] as const;
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

export const RECOMMENDATION_EVENT_TYPES = [
  'shown',
  'viewed',
  'clicked',
  'dismissed',
  'completed',
] as const;
export type RecommendationEventType = (typeof RECOMMENDATION_EVENT_TYPES)[number];

export const RECOMMENDATION_ACTOR_TYPES = ['customer', 'staff', 'system'] as const;
export type RecommendationActorType = (typeof RECOMMENDATION_ACTOR_TYPES)[number];

export const RECOMMENDATION_THRESHOLDS = {
  maxCustomerCards: 5,
  maxStaffCards: 8,
  manualPaymentLookbackDays: 90,
  manualPaymentCountThreshold: 2,
  digitalMigrationBranchTxnThreshold: 3,
  stableBalanceThreshold: 40000,
  stableBalanceDepositMonths: 3,
  salaryDepositThreshold: 2,
  insuranceRenewalDays: 30,
  supportFollowupChatThreshold: 2,
  dismissSuppressionDays: 14,
  actedOnSuppressionDays: 30,
  defaultExpiryDays: 21,
  longExpiryDays: 45,
} as const;

export const RECOMMENDATION_ACTION_ROUTES = {
  autopay: '/payments/autopay',
  insuranceRenewal: '/insurance/renew',
  kyc: '/kyc/fayda',
  atmCard: '/cards/request',
  loanTopup: '/loans/offers',
  savingsPlan: '/savings/plans',
  digitalPayments: '/payments/digital',
  profileSecurity: '/profile/security',
  staffCustomerDetail: '/admin/customers',
  staffLoanWorkflow: '/admin/loans',
  staffSupportQueue: '/admin/support',
  staffRelationshipFollowup: '/admin/relationships',
} as const;
