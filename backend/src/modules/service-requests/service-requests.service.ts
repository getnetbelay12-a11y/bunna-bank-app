import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { NotificationType, UserRole } from '../../common/enums';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/interfaces';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateServiceRequestDto,
  ListServiceRequestsQueryDto,
  UpdateServiceRequestStatusDto,
} from './dto';
import {
  ServiceRequestListResult,
  ServiceRequestResult,
} from './interfaces';
import {
  ServiceRequest,
  ServiceRequestDocument,
} from './schemas/service-request.schema';
import {
  ServiceRequestEvent,
  ServiceRequestEventDocument,
} from './schemas/service-request-event.schema';
import {
  ServiceRequestStatus,
  ServiceRequestType,
} from './service-request.types';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectModel(ServiceRequest.name)
    private readonly serviceRequestModel: Model<ServiceRequestDocument>,
    @InjectModel(ServiceRequestEvent.name)
    private readonly serviceRequestEventModel: Model<ServiceRequestEventDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    currentUser: AuthenticatedUser,
    dto: CreateServiceRequestDto,
  ): Promise<ServiceRequestResult> {
    this.ensureMemberPrincipal(currentUser);
    const member = await this.loadMember(currentUser);

    const request = await this.serviceRequestModel.create({
      memberId: member._id,
      customerId: member.customerId,
      memberName: member.fullName,
      phoneNumber: member.phone,
      branchId: member.branchId,
      districtId: member.districtId,
      branchName: member.preferredBranchName,
      type: dto.type,
      title: dto.title.trim(),
      description: dto.description.trim(),
      payload: dto.payload ?? {},
      attachments: dto.attachments ?? [],
      status: ServiceRequestStatus.SUBMITTED,
    });

    await this.serviceRequestEventModel.create({
      serviceRequestId: request._id,
      actorType: 'member',
      actorId: currentUser.sub,
      actorName: member.fullName,
      eventType: 'created',
      toStatus: ServiceRequestStatus.SUBMITTED,
      note: 'Request submitted by customer.',
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'service_request_created',
      entityType: 'service_request',
      entityId: request._id.toString(),
      before: null,
      after: {
        type: request.type,
        status: request.status,
        title: request.title,
      },
    });

    await this.notifyMember(
      request,
      'Service Request Submitted',
      `${request.title} was submitted successfully and is now awaiting review.`,
    );

    return this.getForActor(currentUser, request._id.toString());
  }

  async listMyRequests(
    currentUser: AuthenticatedUser,
    query: ListServiceRequestsQueryDto,
  ): Promise<ServiceRequestListResult> {
    this.ensureMemberPrincipal(currentUser);
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    return this.list(query, { memberId });
  }

  async getForActor(
    currentUser: AuthenticatedUser,
    requestId: string,
  ): Promise<ServiceRequestResult> {
    const request = await this.serviceRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Service request not found.');
    }

    if (this.isMember(currentUser)) {
      const memberId = currentUser.memberId ?? currentUser.sub;
      if (request.memberId.toString() !== memberId) {
        throw new ForbiddenException('You cannot access this service request.');
      }
    } else {
      this.assertManagerScope(currentUser, request);
    }

    return this.toResult(request, true);
  }

  async cancel(
    currentUser: AuthenticatedUser,
    requestId: string,
  ): Promise<ServiceRequestResult> {
    this.ensureMemberPrincipal(currentUser);
    const request = await this.serviceRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Service request not found.');
    }

    const memberId = currentUser.memberId ?? currentUser.sub;
    if (request.memberId.toString() !== memberId) {
      throw new ForbiddenException('You cannot cancel this service request.');
    }

    if (
      ![ServiceRequestStatus.SUBMITTED, ServiceRequestStatus.AWAITING_CUSTOMER].includes(
        request.status,
      )
    ) {
      throw new BadRequestException('This service request can no longer be cancelled.');
    }

    const beforeStatus = request.status;
    request.status = ServiceRequestStatus.CANCELLED;
    request.cancelledAt = new Date();
    request.latestNote = 'Cancelled by customer.';
    await request.save();

    await this.serviceRequestEventModel.create({
      serviceRequestId: request._id,
      actorType: 'member',
      actorId: currentUser.sub,
      actorName: currentUser.fullName,
      eventType: 'cancelled',
      fromStatus: beforeStatus,
      toStatus: ServiceRequestStatus.CANCELLED,
      note: 'Cancelled by customer.',
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'service_request_cancelled',
      entityType: 'service_request',
      entityId: request._id.toString(),
      before: { status: beforeStatus },
      after: { status: request.status },
    });

    await this.notifyMember(
      request,
      'Service Request Cancelled',
      `${request.title} was cancelled. You can create a new request if further support is needed.`,
    );

    return this.toResult(request, true);
  }

  async listManagerRequests(
    currentUser: AuthenticatedUser,
    query: ListServiceRequestsQueryDto,
  ): Promise<ServiceRequestListResult> {
    this.ensureManager(currentUser);
    return this.list(query, this.buildManagerScope(currentUser));
  }

  async updateStatus(
    currentUser: AuthenticatedUser,
    requestId: string,
    dto: UpdateServiceRequestStatusDto,
  ): Promise<ServiceRequestResult> {
    this.ensureManager(currentUser);
    const request = await this.serviceRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Service request not found.');
    }

    this.assertManagerScope(currentUser, request);

    if (request.status === ServiceRequestStatus.CANCELLED) {
      throw new BadRequestException('Cancelled requests cannot be updated.');
    }

    const beforeStatus = request.status;
    request.status = dto.status;
    request.latestNote = dto.note?.trim() || request.latestNote;
    request.assignedToStaffId = new Types.ObjectId(currentUser.sub);
    request.assignedToStaffName = currentUser.fullName ?? currentUser.identifier;
    request.completedAt =
      dto.status === ServiceRequestStatus.COMPLETED ? new Date() : undefined;
    await request.save();

    await this.serviceRequestEventModel.create({
      serviceRequestId: request._id,
      actorType: 'staff',
      actorId: currentUser.sub,
      actorName: currentUser.fullName ?? currentUser.identifier,
      eventType: 'status_updated',
      fromStatus: beforeStatus,
      toStatus: dto.status,
      note: dto.note?.trim(),
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'service_request_status_updated',
      entityType: 'service_request',
      entityId: request._id.toString(),
      before: { status: beforeStatus },
      after: { status: dto.status, note: dto.note?.trim() },
    });

    await this.notifyMember(
      request,
      this.buildStatusNotificationTitle(dto.status),
      this.buildStatusNotificationMessage(request.title, dto.status, dto.note?.trim()),
    );

    return this.toResult(request, true);
  }

  private async list(
    query: ListServiceRequestsQueryDto,
    baseFilter: FilterQuery<ServiceRequestDocument>,
  ): Promise<ServiceRequestListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: FilterQuery<ServiceRequestDocument> = { ...baseFilter };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search?.trim()) {
      const pattern = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { customerId: pattern },
        { memberName: pattern },
        { title: pattern },
      ];
    }

    const [items, total] = await Promise.all([
      this.serviceRequestModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<ServiceRequestDocument[]>(),
      this.serviceRequestModel.countDocuments(filter),
    ]);

    return {
      items: items.map((item) => this.toResult(item, false)),
      total,
      page,
      limit,
    };
  }

  private async toResult(
    request: ServiceRequestDocument | (ServiceRequestDocument & { id?: string }),
    includeTimeline: boolean,
  ): Promise<ServiceRequestResult>;
  private toResult(
    request: ServiceRequestDocument | (ServiceRequestDocument & { id?: string }),
    includeTimeline: false,
  ): ServiceRequestResult;
  private toResult(
    request: ServiceRequestDocument | (ServiceRequestDocument & { id?: string }),
    includeTimeline: boolean,
  ): ServiceRequestResult | Promise<ServiceRequestResult> {
    const base: ServiceRequestResult = {
      id: request.id ?? request._id.toString(),
      memberId: request.memberId.toString(),
      customerId: request.customerId,
      memberName: request.memberName,
      phoneNumber: request.phoneNumber,
      branchId: request.branchId?.toString(),
      districtId: request.districtId?.toString(),
      branchName: request.branchName,
      type: request.type,
      title: request.title,
      description: request.description,
      payload: request.payload ?? {},
      attachments: request.attachments ?? [],
      status: request.status,
      latestNote: request.latestNote,
      assignedToStaffId: request.assignedToStaffId?.toString(),
      assignedToStaffName: request.assignedToStaffName,
      cancelledAt: request.cancelledAt,
      completedAt: request.completedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };

    if (!includeTimeline) {
      return base;
    }

    return this.serviceRequestEventModel
      .find({ serviceRequestId: request._id })
      .sort({ createdAt: 1 })
      .lean<ServiceRequestEventDocument[]>()
      .then((timeline) => ({
        ...base,
        timeline: timeline.map((event) => ({
          id: event._id.toString(),
          actorType: event.actorType,
          actorId: event.actorId,
          actorName: event.actorName,
          eventType: event.eventType,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          note: event.note,
          createdAt: event.createdAt,
        })),
      }));
  }

  private ensureMemberPrincipal(currentUser: AuthenticatedUser) {
    if (!this.isMember(currentUser)) {
      throw new ForbiddenException('Only members can access this resource.');
    }
  }

  private ensureManager(currentUser: AuthenticatedUser) {
    const allowed = new Set([
      UserRole.SUPPORT_AGENT,
      UserRole.BRANCH_MANAGER,
      UserRole.DISTRICT_OFFICER,
      UserRole.DISTRICT_MANAGER,
      UserRole.HEAD_OFFICE_OFFICER,
      UserRole.HEAD_OFFICE_MANAGER,
      UserRole.ADMIN,
    ]);

    if (!allowed.has(currentUser.role)) {
      throw new ForbiddenException('Only staff users can access this resource.');
    }
  }

  private isMember(currentUser: AuthenticatedUser) {
    return (
      currentUser.role === UserRole.MEMBER ||
      currentUser.role === UserRole.SHAREHOLDER_MEMBER
    );
  }

  private async loadMember(currentUser: AuthenticatedUser) {
    const memberId = this.toObjectId(currentUser.memberId ?? currentUser.sub);
    const member = await this.memberModel.findById(memberId);

    if (!member || !member.isActive) {
      throw new ForbiddenException('Inactive members cannot use this service.');
    }

    return member;
  }

  private async notifyMember(
    request: ServiceRequestDocument,
    title: string,
    message: string,
  ) {
    const paymentRelated = this.isPaymentRelatedRequest(request.type);

    await this.notificationsService.createNotification({
      userType: 'member',
      userId: request.memberId.toString(),
      type: NotificationType.SERVICE_REQUEST,
      title,
      message,
      entityType: 'service_request',
      entityId: request._id.toString(),
      actionLabel: paymentRelated ? 'Open receipts' : 'Open request',
      priority: this.resolveNotificationPriority(request.status),
      deepLink: paymentRelated
        ? '/payments/receipts?filter=disputes'
        : `/service-requests/${request._id.toString()}`,
    });
  }

  private isPaymentRelatedRequest(type: string) {
    return (
      type === ServiceRequestType.FAILED_TRANSFER ||
      type === ServiceRequestType.PAYMENT_DISPUTE
    );
  }

  private resolveNotificationPriority(status: ServiceRequestStatus) {
    switch (status) {
      case ServiceRequestStatus.AWAITING_CUSTOMER:
      case ServiceRequestStatus.REJECTED:
        return 'high';
      case ServiceRequestStatus.UNDER_REVIEW:
      case ServiceRequestStatus.APPROVED:
        return 'normal';
      case ServiceRequestStatus.COMPLETED:
      case ServiceRequestStatus.CANCELLED:
      case ServiceRequestStatus.SUBMITTED:
      default:
        return 'low';
    }
  }

  private buildStatusNotificationTitle(status: ServiceRequestStatus) {
    switch (status) {
      case ServiceRequestStatus.UNDER_REVIEW:
        return 'Service Request Under Review';
      case ServiceRequestStatus.AWAITING_CUSTOMER:
        return 'Action Needed On Service Request';
      case ServiceRequestStatus.APPROVED:
        return 'Service Request Approved';
      case ServiceRequestStatus.REJECTED:
        return 'Service Request Rejected';
      case ServiceRequestStatus.COMPLETED:
        return 'Service Request Completed';
      case ServiceRequestStatus.CANCELLED:
        return 'Service Request Cancelled';
      case ServiceRequestStatus.SUBMITTED:
      default:
        return 'Service Request Submitted';
    }
  }

  private buildStatusNotificationMessage(
    requestTitle: string,
    status: ServiceRequestStatus,
    note?: string,
  ) {
    const baseMessage = (() => {
      switch (status) {
        case ServiceRequestStatus.UNDER_REVIEW:
          return `${requestTitle} is now under review by the bank team.`;
        case ServiceRequestStatus.AWAITING_CUSTOMER:
          return `${requestTitle} needs more information from you before processing can continue.`;
        case ServiceRequestStatus.APPROVED:
          return `${requestTitle} has been approved and is moving to the next step.`;
        case ServiceRequestStatus.REJECTED:
          return `${requestTitle} was rejected after review.`;
        case ServiceRequestStatus.COMPLETED:
          return `${requestTitle} has been completed successfully.`;
        case ServiceRequestStatus.CANCELLED:
          return `${requestTitle} was cancelled.`;
        case ServiceRequestStatus.SUBMITTED:
        default:
          return `${requestTitle} was submitted successfully.`;
      }
    })();

    return note ? `${baseMessage} Note: ${note}` : baseMessage;
  }

  private buildManagerScope(currentUser: AuthenticatedUser) {
    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      return { branchId: this.toObjectId(currentUser.branchId) };
    }

    if (
      [UserRole.DISTRICT_MANAGER, UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
      currentUser.districtId
    ) {
      return { districtId: this.toObjectId(currentUser.districtId) };
    }

    return {};
  }

  private assertManagerScope(
    currentUser: AuthenticatedUser,
    request: ServiceRequestDocument,
  ) {
    const scope = this.buildManagerScope(currentUser);
    if (
      scope.branchId &&
      request.branchId?.toString() !== (scope.branchId as Types.ObjectId).toString()
    ) {
      throw new ForbiddenException('This request is outside your branch scope.');
    }

    if (
      scope.districtId &&
      request.districtId?.toString() !== (scope.districtId as Types.ObjectId).toString()
    ) {
      throw new ForbiddenException('This request is outside your district scope.');
    }
  }

  private toObjectId(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid identifier.');
    }

    return new Types.ObjectId(value);
  }
}
