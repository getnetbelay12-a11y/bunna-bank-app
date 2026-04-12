export enum ServiceRequestType {
  FAILED_TRANSFER = 'failed_transfer',
  PAYMENT_DISPUTE = 'payment_dispute',
  PHONE_UPDATE = 'phone_update',
  ATM_CARD_REQUEST = 'atm_card_request',
  ACCOUNT_RELATIONSHIP = 'account_relationship',
  SECURITY_REVIEW = 'security_review',
}

export enum ServiceRequestStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  AWAITING_CUSTOMER = 'awaiting_customer',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
