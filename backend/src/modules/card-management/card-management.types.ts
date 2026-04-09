export enum CardStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
  BLOCKED = 'blocked',
  PENDING_ISSUE = 'pending_issue',
  REPLACEMENT_REQUESTED = 'replacement_requested',
}

export enum CardRequestType {
  NEW_ISSUE = 'new_issue',
  REPLACEMENT = 'replacement',
}

export enum CardRequestStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}
