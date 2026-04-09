import type {
  AuditLogItem,
  AutopayOperationItem,
  NotificationCampaignItem,
  OnboardingReviewItem,
  SupportChatSummaryItem,
  VoteAdminItem,
} from '../../core/api/contracts';

export function isSupportAttention(item: SupportChatSummaryItem) {
  return (
    item.escalationFlag ||
    item.priority === 'high' ||
    ['open', 'assigned', 'waiting_agent'].includes(item.status)
  );
}

export function isKycAttention(item: OnboardingReviewItem) {
  return (
    item.onboardingReviewStatus === 'needs_action' ||
    item.onboardingReviewStatus === 'review_in_progress'
  );
}

export function isNotificationFailure(item: NotificationCampaignItem) {
  return item.status === 'failed';
}

export function isAutopayAttention(item: AutopayOperationItem) {
  return (
    item.operationalStatus === 'paused' ||
    item.actionRequired.toLowerCase().includes('follow') ||
    item.actionRequired.toLowerCase().includes('review')
  );
}

export function isGovernanceAttention(vote: VoteAdminItem) {
  return vote.status === 'draft' || (vote.status === 'open' && vote.participationRate < 50);
}

export function isAuditAttention(item: AuditLogItem) {
  return (
    item.action.includes('vote') ||
    item.action.includes('loan') ||
    item.action.includes('profile')
  );
}

export function isAuditGovernanceEvent(item: AuditLogItem) {
  return item.action.includes('vote');
}

export function isAuditLoanEvent(item: AuditLogItem) {
  return item.action.includes('loan');
}

export function isAuditProfileEvent(item: AuditLogItem) {
  return item.action.includes('profile');
}
