import { ServiceRequestStatus, ServiceRequestType } from '../service-request.types';

export interface ServiceRequestEventResult {
  id: string;
  actorType: string;
  actorId?: string;
  actorName?: string;
  eventType: string;
  fromStatus?: ServiceRequestStatus;
  toStatus?: ServiceRequestStatus;
  note?: string;
  createdAt?: Date;
}

export interface ServiceRequestResult {
  id: string;
  memberId: string;
  customerId: string;
  memberName: string;
  phoneNumber?: string;
  branchId?: string;
  districtId?: string;
  branchName?: string;
  type: ServiceRequestType;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  attachments: string[];
  status: ServiceRequestStatus;
  dueAt?: Date;
  slaState?: 'on_track' | 'due_soon' | 'overdue';
  slaBreachedAt?: Date;
  breachAcknowledgedAt?: Date;
  breachAcknowledgedBy?: string;
  investigationStartedAt?: Date;
  investigationStartedBy?: string;
  investigationStalledAt?: Date;
  escalatedAt?: Date;
  escalatedBy?: string;
  followUpState?:
    | 'not_breached'
    | 'pending_acknowledgment'
    | 'awaiting_investigation'
    | 'investigation_started'
    | 'investigation_stalled';
  latestNote?: string;
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  cancelledAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  timeline?: ServiceRequestEventResult[];
}

export interface ServiceRequestListResult {
  items: ServiceRequestResult[];
  total: number;
  page: number;
  limit: number;
}

export interface SecurityReviewMetricsResult {
  metadata: {
    contractVersion: 'security_review_metrics.v2';
    currentStateBasis: 'live_service_request_state';
    historyBasis: 'retained_daily_aggregates_with_event_fallback';
    historyEventTypes: ['investigation_stalled', 'stalled_case_escalated'];
    retentionWindowDays: number;
  };
  currentState: {
    openCount: number;
    breachedCount: number;
    dueSoonCount: number;
    stalledCount: number;
    takeoverCount: number;
  };
  history: {
    stalledLast7Days: number;
    stalledPrevious7Days: number;
    takeoversLast7Days: number;
    takeoversPrevious7Days: number;
  };
}
