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
