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
import { Staff, StaffDocument } from '../staff/schemas/staff.schema';
import {
  CreateManagerSecurityReviewDto,
  CreateServiceRequestDto,
  ListServiceRequestsQueryDto,
  ReportSecurityReviewMetricsContractIssueDto,
  UpdateServiceRequestStatusDto,
} from './dto';
import {
  SecurityReviewMetricsResult,
  ServiceRequestListResult,
  ServiceRequestResult,
} from './interfaces';
import {
  SecurityReviewDailySnapshot,
  SecurityReviewDailySnapshotDocument,
} from './schemas/security-review-daily-snapshot.schema';
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
    @InjectModel(SecurityReviewDailySnapshot.name)
    private readonly securityReviewDailySnapshotModel: Model<SecurityReviewDailySnapshotDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,
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

  async createManagerSecurityReview(
    currentUser: AuthenticatedUser,
    dto: CreateManagerSecurityReviewDto,
  ): Promise<ServiceRequestResult> {
    this.ensureSecurityReviewCreator(currentUser);

    const member = await this.memberModel.findById(this.toObjectId(dto.memberId));
    if (!member || !member.isActive) {
      throw new NotFoundException('Member was not found for security review.');
    }

    this.assertManagerMemberScope(currentUser, member);

    const existingOpenRequest = await this.serviceRequestModel
      .findOne({
        memberId: member._id,
        type: ServiceRequestType.SECURITY_REVIEW,
        status: {
          $nin: [
            ServiceRequestStatus.COMPLETED,
            ServiceRequestStatus.REJECTED,
            ServiceRequestStatus.CANCELLED,
          ],
        },
      })
      .lean<ServiceRequestDocument | null>();

    if (existingOpenRequest) {
      throw new BadRequestException(
        `An active security review already exists for this member: ${existingOpenRequest._id.toString()}.`,
      );
    }

    const title = `Security review: repeated step-up failures for ${member.customerId}`;
    const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const description = [
      `${dto.failureCount} failed high-risk step-up attempts were observed in the last 7 days.`,
      `Threshold in force: ${dto.escalationThreshold}.`,
      `Reviewer under watch: ${dto.reviewerLabel.trim()}.`,
      `Target member: ${dto.memberLabel.trim()}.`,
    ].join(' ');

    const request = await this.serviceRequestModel.create({
      memberId: member._id,
      customerId: member.customerId,
      memberName: member.fullName,
      phoneNumber: member.phone,
      branchId: member.branchId,
      districtId: member.districtId,
      branchName: member.preferredBranchName,
      type: ServiceRequestType.SECURITY_REVIEW,
      title,
      description,
      payload: {
        source: 'audit_step_up_failure_watchlist',
        queue: 'security_review',
        slaHours: 24,
        dueAt: dueAt.toISOString(),
        escalationRole: UserRole.HEAD_OFFICE_MANAGER,
        failureCount7d: dto.failureCount,
        escalationThreshold: dto.escalationThreshold,
        latestFailureAt: dto.latestFailureAt,
        reviewerLabel: dto.reviewerLabel.trim(),
        memberLabel: dto.memberLabel.trim(),
        reasonCodes: dto.reasonCodes ?? [],
        relatedAuditIds: dto.auditIds ?? [],
      },
      attachments: [],
      status: ServiceRequestStatus.SUBMITTED,
      assignedToStaffId: new Types.ObjectId(currentUser.sub),
      assignedToStaffName: currentUser.fullName ?? currentUser.identifier,
      latestNote: 'Flagged from the audit step-up failure watchlist.',
    });

    await this.serviceRequestEventModel.create({
      serviceRequestId: request._id,
      actorType: 'staff',
      actorId: currentUser.sub,
      actorName: currentUser.fullName ?? currentUser.identifier,
      eventType: 'security_review_created',
      toStatus: ServiceRequestStatus.SUBMITTED,
      note: 'Created from repeated step-up failure watchlist.',
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'security_review_service_request_created',
      entityType: 'service_request',
      entityId: request._id.toString(),
      before: null,
      after: {
        memberId: member._id.toString(),
        type: request.type,
        status: request.status,
        payload: request.payload,
      },
    });

    return this.getForActor(currentUser, request._id.toString());
  }

  async reportSecurityReviewMetricsContractIssue(
    currentUser: AuthenticatedUser,
    dto: ReportSecurityReviewMetricsContractIssueDto,
  ) {
    this.ensureSecurityReviewCreator(currentUser);

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'unsupported_security_review_metrics_contract_detected',
      entityType: 'staff',
      entityId: currentUser.sub,
      before: null,
      after: {
        detectedContractVersion: dto.detectedContractVersion.trim(),
        supportedContractVersion: dto.supportedContractVersion.trim(),
        source: dto.source.trim(),
      },
    });

    return { ok: true };
  }

  async assignToCurrentReviewer(
    currentUser: AuthenticatedUser,
    requestId: string,
  ): Promise<ServiceRequestResult> {
    this.ensureSecurityReviewCreator(currentUser);
    const request = await this.serviceRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Service request not found.');
    }

    if (request.type !== ServiceRequestType.SECURITY_REVIEW) {
      throw new BadRequestException('Only security review cases can be reassigned here.');
    }

    const beforeAssignment = {
      assignedToStaffId: request.assignedToStaffId?.toString(),
      assignedToStaffName: request.assignedToStaffName,
      investigationStartedAt:
        typeof request.payload?.investigationStartedAt === 'string'
          ? request.payload.investigationStartedAt
          : null,
      investigationStartedBy:
        typeof request.payload?.investigationStartedBy === 'string'
          ? request.payload.investigationStartedBy
          : null,
    };
    request.assignedToStaffId = new Types.ObjectId(currentUser.sub);
    request.assignedToStaffName = currentUser.fullName ?? currentUser.identifier;
    if (!request.payload?.investigationStartedAt) {
      request.payload = {
        ...(request.payload ?? {}),
        investigationStartedAt: new Date().toISOString(),
        investigationStartedBy: request.assignedToStaffName,
      };
    }
    request.latestNote = `Assigned to ${request.assignedToStaffName} for active investigation.`;
    request.updatedAt = new Date();
    await request.save();

    await this.serviceRequestEventModel.create({
      serviceRequestId: request._id,
      actorType: 'staff',
      actorId: currentUser.sub,
      actorName: currentUser.fullName ?? currentUser.identifier,
      eventType: 'assigned',
      fromStatus: request.status,
      toStatus: request.status,
      note: request.latestNote,
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'service_request_assigned',
      entityType: 'service_request',
      entityId: request._id.toString(),
      before: beforeAssignment,
      after: {
        assignedToStaffId: request.assignedToStaffId.toString(),
        assignedToStaffName: request.assignedToStaffName,
        investigationStartedAt:
          typeof request.payload?.investigationStartedAt === 'string'
            ? request.payload.investigationStartedAt
            : undefined,
        investigationStartedBy:
          typeof request.payload?.investigationStartedBy === 'string'
            ? request.payload.investigationStartedBy
            : undefined,
      },
    });

    return this.getForActor(currentUser, request._id.toString());
  }

  async acknowledgeSecurityReviewBreach(
    currentUser: AuthenticatedUser,
    requestId: string,
  ): Promise<ServiceRequestResult> {
    this.ensureSecurityReviewCreator(currentUser);
    const request = await this.serviceRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Service request not found.');
    }

    if (request.type !== ServiceRequestType.SECURITY_REVIEW) {
      throw new BadRequestException('Only security review cases support breach acknowledgment.');
    }

    if (!request.payload?.slaBreachedAt) {
      throw new BadRequestException('This security review does not have a recorded SLA breach.');
    }

    if (request.payload?.breachAcknowledgedAt) {
      return this.getForActor(currentUser, request._id.toString());
    }

    const acknowledgedAt = new Date().toISOString();
    const acknowledgedBy = currentUser.fullName ?? currentUser.identifier;
    request.payload = {
      ...(request.payload ?? {}),
      breachAcknowledgedAt: acknowledgedAt,
      breachAcknowledgedBy: acknowledgedBy,
    };
    request.latestNote = `SLA breach acknowledged by ${acknowledgedBy}.`;
    request.updatedAt = new Date();
    await request.save();

    await this.serviceRequestEventModel.create({
      serviceRequestId: request._id,
      actorType: 'staff',
      actorId: currentUser.sub,
      actorName: acknowledgedBy,
      eventType: 'status_updated',
      fromStatus: request.status,
      toStatus: request.status,
      note: request.latestNote,
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'security_review_breach_acknowledged',
      entityType: 'service_request',
      entityId: request._id.toString(),
      before: {
        breachAcknowledgedAt: null,
        breachAcknowledgedBy: null,
      },
      after: {
        breachAcknowledgedAt: acknowledgedAt,
        breachAcknowledgedBy: acknowledgedBy,
      },
    });

    return this.getForActor(currentUser, request._id.toString());
  }

  async escalateStalledSecurityReview(
    currentUser: AuthenticatedUser,
    requestId: string,
  ): Promise<ServiceRequestResult> {
    const allowed = new Set([UserRole.HEAD_OFFICE_MANAGER, UserRole.ADMIN]);
    if (!allowed.has(currentUser.role)) {
      throw new ForbiddenException('Only higher-authority reviewers can take over stalled cases.');
    }

    const request = await this.serviceRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Service request not found.');
    }

    if (request.type !== ServiceRequestType.SECURITY_REVIEW) {
      throw new BadRequestException('Only security review cases support stalled escalation.');
    }

    if (this.resolveFollowUpState(request) !== 'investigation_stalled') {
      throw new BadRequestException('This security review is not currently in a stalled state.');
    }

    const beforeAssignment = {
      assignedToStaffId: request.assignedToStaffId?.toString(),
      assignedToStaffName: request.assignedToStaffName,
    };
    const escalatedBy = currentUser.fullName ?? currentUser.identifier;
    const escalatedAt = new Date().toISOString();
    request.assignedToStaffId = new Types.ObjectId(currentUser.sub);
    request.assignedToStaffName = escalatedBy;
    request.payload = {
      ...(request.payload ?? {}),
      escalatedAt,
      escalatedBy,
      escalationState: 'stalled_case_taken_over_by_higher_authority',
      investigationStartedAt:
        typeof request.payload?.investigationStartedAt === 'string'
          ? request.payload.investigationStartedAt
          : escalatedAt,
      investigationStartedBy:
        typeof request.payload?.investigationStartedBy === 'string'
          ? request.payload.investigationStartedBy
          : escalatedBy,
    };
    request.latestNote = `Stalled investigation escalated to ${escalatedBy}.`;
    request.updatedAt = new Date();
    await request.save();

    await this.serviceRequestEventModel.create({
      serviceRequestId: request._id,
      actorType: 'staff',
      actorId: currentUser.sub,
      actorName: escalatedBy,
      eventType: 'stalled_case_escalated',
      fromStatus: request.status,
      toStatus: request.status,
      note: request.latestNote,
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'security_review_stalled_case_escalated',
      entityType: 'service_request',
      entityId: request._id.toString(),
      before: beforeAssignment,
      after: {
        assignedToStaffId: request.assignedToStaffId.toString(),
        assignedToStaffName: request.assignedToStaffName,
        escalatedAt,
        escalatedBy,
      },
    });

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

    await this.recordSlaBreachIfNeeded(request);
    await this.recordInvestigationStallIfNeeded(request);

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

  async getSecurityReviewMetrics(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityReviewMetricsResult> {
    this.ensureSecurityReviewCreator(currentUser);

    const scope = this.buildManagerScope(currentUser);
    const filter: FilterQuery<ServiceRequestDocument> = {
      ...scope,
      type: ServiceRequestType.SECURITY_REVIEW,
    };
    const items = await this.serviceRequestModel.find(filter).lean<ServiceRequestDocument[]>();

    const now = new Date(Date.now());
    const todayStart = this.startOfDay(now);
    const currentWindowStart = this.shiftDays(todayStart, -6);
    const previousWindowStart = this.shiftDays(todayStart, -13);

    const currentMetrics = this.buildSecurityReviewCurrentMetrics(items);
    const securityReviewEvents = await this.loadSecurityReviewEvents(
      items.map((item) => item._id),
      previousWindowStart,
    );

    await this.persistSecurityReviewDailySnapshots(
      securityReviewEvents,
      currentMetrics,
      previousWindowStart,
      todayStart,
    );

    const snapshots = await this.securityReviewDailySnapshotModel
      .find({
        periodStart: {
          $gte: previousWindowStart,
        },
      })
      .sort({ periodStart: 1 })
      .lean<SecurityReviewDailySnapshotDocument[]>();

    const sumSnapshotField = (
      field: 'stalledEventsCount' | 'takeoverEventsCount',
      start: Date,
      end?: Date,
    ) =>
      snapshots
        .filter((snapshot) => {
          const timestamp = snapshot.periodStart.getTime();
          return (
            timestamp >= start.getTime() &&
            (end == null || timestamp < end.getTime())
          );
        })
        .reduce((total, snapshot) => total + (snapshot[field] ?? 0), 0);

    const countWithinWindow = (
      eventType: 'investigation_stalled' | 'stalled_case_escalated',
      start: Date,
      end?: Date,
    ) =>
      securityReviewEvents.filter((event) => {
        if (event.eventType !== eventType || !event.createdAt) {
          return false;
        }

        const timestamp = event.createdAt.getTime();
        return (
          timestamp >= start.getTime() &&
          (end == null || timestamp < end.getTime())
        );
      }).length;

    return {
      metadata: {
        contractVersion: 'security_review_metrics.v2',
        currentStateBasis: 'live_service_request_state',
        historyBasis: 'retained_daily_aggregates_with_event_fallback',
        historyEventTypes: ['investigation_stalled', 'stalled_case_escalated'],
        retentionWindowDays: 14,
      },
      currentState: currentMetrics,
      history: {
        stalledLast7Days:
          sumSnapshotField('stalledEventsCount', currentWindowStart) ||
          countWithinWindow('investigation_stalled', currentWindowStart),
        stalledPrevious7Days:
          sumSnapshotField('stalledEventsCount', previousWindowStart, currentWindowStart) ||
          countWithinWindow(
            'investigation_stalled',
            previousWindowStart,
            currentWindowStart,
          ),
        takeoversLast7Days:
          sumSnapshotField('takeoverEventsCount', currentWindowStart) ||
          countWithinWindow('stalled_case_escalated', currentWindowStart),
        takeoversPrevious7Days:
          sumSnapshotField('takeoverEventsCount', previousWindowStart, currentWindowStart) ||
          countWithinWindow(
            'stalled_case_escalated',
            previousWindowStart,
            currentWindowStart,
          ),
      },
    };
  }

  async materializeRecentSecurityReviewSnapshots(days = 14) {
    const safeDays = Math.max(Math.trunc(days), 1);
    const items = await this.serviceRequestModel
      .find({ type: ServiceRequestType.SECURITY_REVIEW })
      .lean<ServiceRequestDocument[]>();
    const todayStart = this.startOfDay(new Date(Date.now()));
    const windowStart = this.shiftDays(todayStart, -(safeDays - 1));
    const securityReviewEvents = await this.loadSecurityReviewEvents(
      items.map((item) => item._id),
      windowStart,
    );

    await this.persistSecurityReviewDailySnapshots(
      securityReviewEvents,
      this.buildSecurityReviewCurrentMetrics(items),
      windowStart,
      todayStart,
    );
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

    await Promise.all(items.map((item) => this.recordSlaBreachIfNeeded(item)));
    await Promise.all(items.map((item) => this.recordInvestigationStallIfNeeded(item)));

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
      dueAt: this.resolveDueAt(request),
      slaState: this.resolveSlaState(request),
      slaBreachedAt: this.resolveSlaBreachedAt(request),
      breachAcknowledgedAt: this.resolveDateField(request, 'breachAcknowledgedAt'),
      breachAcknowledgedBy:
        typeof request.payload?.breachAcknowledgedBy === 'string'
          ? request.payload.breachAcknowledgedBy
          : undefined,
      investigationStartedAt: this.resolveDateField(request, 'investigationStartedAt'),
      investigationStartedBy:
        typeof request.payload?.investigationStartedBy === 'string'
          ? request.payload.investigationStartedBy
          : undefined,
      investigationStalledAt: this.resolveDateField(request, 'investigationStalledAt'),
      escalatedAt: this.resolveDateField(request, 'escalatedAt'),
      escalatedBy:
        typeof request.payload?.escalatedBy === 'string'
          ? request.payload.escalatedBy
          : undefined,
      followUpState: this.resolveFollowUpState(request),
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

  private ensureSecurityReviewCreator(currentUser: AuthenticatedUser) {
    const allowed = new Set([
      UserRole.HEAD_OFFICE_OFFICER,
      UserRole.HEAD_OFFICE_MANAGER,
      UserRole.ADMIN,
    ]);

    if (!allowed.has(currentUser.role)) {
      throw new ForbiddenException('Only head office security reviewers can create this case.');
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

  private assertManagerMemberScope(
    currentUser: AuthenticatedUser,
    member: Pick<MemberDocument, 'branchId' | 'districtId'>,
  ) {
    const scope = this.buildManagerScope(currentUser);
    if (
      scope.branchId &&
      member.branchId?.toString() !== (scope.branchId as Types.ObjectId).toString()
    ) {
      throw new ForbiddenException('This member is outside your branch scope.');
    }

    if (
      scope.districtId &&
      member.districtId?.toString() !== (scope.districtId as Types.ObjectId).toString()
    ) {
      throw new ForbiddenException('This member is outside your district scope.');
    }
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

  private async persistSecurityReviewDailySnapshots(
    events: ServiceRequestEventDocument[],
    input: {
      openCount: number;
      breachedCount: number;
      dueSoonCount: number;
      stalledCount: number;
      takeoverCount: number;
    },
    windowStart: Date,
    windowEnd: Date,
  ) {
    const dayStarts = this.buildDailyPeriods(windowStart, windowEnd);

    await Promise.all(
      dayStarts.map((periodStart) => {
        const periodEnd = this.shiftDays(periodStart, 1);
        const isCurrentDay = periodStart.getTime() === windowEnd.getTime();

        return this.securityReviewDailySnapshotModel.findOneAndUpdate(
          { periodStart },
          {
            $set: {
              periodStart,
              stalledEventsCount: this.countSecurityReviewEventsWithinWindow(
                events,
                'investigation_stalled',
                periodStart,
                periodEnd,
              ),
              takeoverEventsCount: this.countSecurityReviewEventsWithinWindow(
                events,
                'stalled_case_escalated',
                periodStart,
                periodEnd,
              ),
              ...(isCurrentDay
                ? {
                    openCount: input.openCount,
                    breachedCount: input.breachedCount,
                    dueSoonCount: input.dueSoonCount,
                    stalledCount: input.stalledCount,
                    takeoverCount: input.takeoverCount,
                  }
                : {}),
            },
            $setOnInsert: {
              openCount: 0,
              breachedCount: 0,
              dueSoonCount: 0,
              stalledCount: 0,
              takeoverCount: 0,
            },
          },
          { upsert: true, new: true },
        );
      }),
    );
  }

  private buildSecurityReviewCurrentMetrics(items: ServiceRequestDocument[]) {
    return {
      openCount: items.filter((item) =>
        ![
          ServiceRequestStatus.COMPLETED,
          ServiceRequestStatus.REJECTED,
          ServiceRequestStatus.CANCELLED,
        ].includes(item.status),
      ).length,
      breachedCount: items.filter((item) => this.resolveSlaState(item) === 'overdue').length,
      dueSoonCount: items.filter((item) => this.resolveSlaState(item) === 'due_soon').length,
      stalledCount: items.filter((item) => this.resolveFollowUpState(item) === 'investigation_stalled').length,
      takeoverCount: items.filter((item) => this.resolveDateField(item, 'escalatedAt') != null).length,
    };
  }

  private buildDailyPeriods(start: Date, end: Date) {
    const periods: Date[] = [];
    for (
      let cursor = this.startOfDay(start);
      cursor.getTime() <= end.getTime();
      cursor = this.shiftDays(cursor, 1)
    ) {
      periods.push(cursor);
    }

    return periods;
  }

  private countSecurityReviewEventsWithinWindow(
    events: Pick<ServiceRequestEventDocument, 'eventType' | 'createdAt'>[],
    eventType: 'investigation_stalled' | 'stalled_case_escalated',
    start: Date,
    end: Date,
  ) {
    return events.filter((event) => {
      if (event.eventType !== eventType || !event.createdAt) {
        return false;
      }

      const timestamp = event.createdAt.getTime();
      return timestamp >= start.getTime() && timestamp < end.getTime();
    }).length;
  }

  private loadSecurityReviewEvents(serviceRequestIds: Types.ObjectId[], windowStart: Date) {
    if (serviceRequestIds.length === 0) {
      return Promise.resolve([] as ServiceRequestEventDocument[]);
    }

    return this.serviceRequestEventModel
      .find({
        serviceRequestId: { $in: serviceRequestIds },
        eventType: { $in: ['investigation_stalled', 'stalled_case_escalated'] },
        createdAt: { $gte: windowStart },
      })
      .lean<ServiceRequestEventDocument[]>();
  }

  private startOfDay(value: Date) {
    const next = new Date(value);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  private shiftDays(value: Date, days: number) {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    return next;
  }

  private async recordSlaBreachIfNeeded(
    request: Pick<
      ServiceRequestDocument,
      '_id' | 'type' | 'status' | 'payload' | 'latestNote'
    >,
  ) {
    if (this.resolveSlaState(request) !== 'overdue' || this.resolveSlaBreachedAt(request)) {
      return;
    }

    const breachedAt = new Date().toISOString();
    const nextPayload = {
      ...(request.payload ?? {}),
      slaBreachedAt: breachedAt,
      escalationState: 'breached_head_office_attention_required',
    };
    const breachNote = 'Security review SLA breached. Head office follow-up is now required.';

    const updateResult = await this.serviceRequestModel.updateOne(
      { _id: request._id, 'payload.slaBreachedAt': { $exists: false } },
      {
        $set: {
          payload: nextPayload,
          latestNote: breachNote,
          updatedAt: new Date(),
        },
      },
    );

    if ((updateResult?.modifiedCount ?? 0) === 0) {
      return;
    }

    request.payload = nextPayload as ServiceRequestDocument['payload'];
    request.latestNote = breachNote;

    await this.serviceRequestEventModel.create({
      serviceRequestId: request._id,
      actorType: 'system',
      actorName: 'SLA Monitor',
      eventType: 'sla_breached',
      fromStatus: request.status,
      toStatus: request.status,
      note: breachNote,
    });

    await this.auditService.logActorAction({
      actorId: request._id.toString(),
      actorRole: UserRole.ADMIN,
      actionType: 'security_review_sla_breached',
      entityType: 'service_request',
      entityId: request._id.toString(),
      before: {
        slaBreachedAt: null,
      },
      after: {
        slaBreachedAt: breachedAt,
        escalationState: 'breached_head_office_attention_required',
      },
    });

    await this.notifyHeadOfficeSecurityBreach(request._id.toString(), breachNote);
  }

  private async recordInvestigationStallIfNeeded(
    request: Pick<
      ServiceRequestDocument,
      '_id' | 'type' | 'status' | 'payload' | 'latestNote'
    >,
  ) {
    if (
      request.type !== ServiceRequestType.SECURITY_REVIEW ||
      this.resolveDateField(request, 'investigationStalledAt') ||
      this.resolveDateField(request, 'investigationStartedAt')
    ) {
      return;
    }

    const breachAcknowledgedAt = this.resolveDateField(request, 'breachAcknowledgedAt');
    if (!breachAcknowledgedAt) {
      return;
    }

    const msSinceAcknowledged = Date.now() - breachAcknowledgedAt.getTime();
    if (msSinceAcknowledged < 2 * 60 * 60 * 1000) {
      return;
    }

    const stalledAt = new Date().toISOString();
    const nextPayload = {
      ...(request.payload ?? {}),
      investigationStalledAt: stalledAt,
      escalationState: 'acknowledged_but_investigation_not_started',
    };
    const note =
      'SLA breach was acknowledged but investigation did not start within the follow-up window.';

    const updateResult = await this.serviceRequestModel.updateOne(
      { _id: request._id, 'payload.investigationStalledAt': { $exists: false } },
      {
        $set: {
          payload: nextPayload,
          latestNote: note,
          updatedAt: new Date(),
        },
      },
    );

    if ((updateResult?.modifiedCount ?? 0) === 0) {
      return;
    }

    request.payload = nextPayload as ServiceRequestDocument['payload'];
    request.latestNote = note;

    await this.serviceRequestEventModel.create({
      serviceRequestId: request._id,
      actorType: 'system',
      actorName: 'Follow-Up Monitor',
      eventType: 'investigation_stalled',
      fromStatus: request.status,
      toStatus: request.status,
      note,
    });

    await this.auditService.logActorAction({
      actorId: request._id.toString(),
      actorRole: UserRole.ADMIN,
      actionType: 'security_review_investigation_stalled',
      entityType: 'service_request',
      entityId: request._id.toString(),
      before: {
        investigationStalledAt: null,
      },
      after: {
        investigationStalledAt: stalledAt,
        escalationState: 'acknowledged_but_investigation_not_started',
      },
    });

    await this.notifySecurityInvestigationStalledEscalation(request._id.toString());
  }

  private resolveDueAt(
    request: Pick<ServiceRequestDocument, 'type' | 'payload'>,
  ) {
    if (request.type !== ServiceRequestType.SECURITY_REVIEW) {
      return undefined;
    }

    const rawDueAt =
      request.payload != null && typeof request.payload.dueAt === 'string'
        ? request.payload.dueAt
        : undefined;
    if (!rawDueAt) {
      return undefined;
    }

    const parsed = new Date(rawDueAt);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private resolveSlaBreachedAt(
    request: Pick<ServiceRequestDocument, 'type' | 'payload'>,
  ) {
    return this.resolveDateField(request, 'slaBreachedAt');
  }

  private resolveSlaState(
    request: Pick<ServiceRequestDocument, 'type' | 'status' | 'payload'>,
  ): 'on_track' | 'due_soon' | 'overdue' | undefined {
    if (
      request.type !== ServiceRequestType.SECURITY_REVIEW ||
      [
        ServiceRequestStatus.COMPLETED,
        ServiceRequestStatus.REJECTED,
        ServiceRequestStatus.CANCELLED,
      ].includes(request.status)
    ) {
      return undefined;
    }

    const dueAt = this.resolveDueAt(request);
    if (!dueAt) {
      return undefined;
    }

    const msUntilDue = dueAt.getTime() - Date.now();
    if (msUntilDue <= 0) {
      return 'overdue';
    }

    return msUntilDue <= 4 * 60 * 60 * 1000 ? 'due_soon' : 'on_track';
  }

  private resolveFollowUpState(
    request: Pick<ServiceRequestDocument, 'type' | 'status' | 'payload'>,
  ):
    | 'not_breached'
    | 'pending_acknowledgment'
    | 'awaiting_investigation'
    | 'investigation_started'
    | 'investigation_stalled'
    | undefined {
    if (
      request.type !== ServiceRequestType.SECURITY_REVIEW ||
      [
        ServiceRequestStatus.COMPLETED,
        ServiceRequestStatus.REJECTED,
        ServiceRequestStatus.CANCELLED,
      ].includes(request.status)
    ) {
      return undefined;
    }

    if (!this.resolveSlaBreachedAt(request)) {
      return 'not_breached';
    }

    if (this.resolveDateField(request, 'investigationStartedAt')) {
      return 'investigation_started';
    }

    if (this.resolveDateField(request, 'investigationStalledAt')) {
      return 'investigation_stalled';
    }

    if (this.resolveDateField(request, 'breachAcknowledgedAt')) {
      return 'awaiting_investigation';
    }

    return 'pending_acknowledgment';
  }

  private resolveDateField(
    request: Pick<ServiceRequestDocument, 'type' | 'payload'>,
    field:
      | 'slaBreachedAt'
      | 'breachAcknowledgedAt'
      | 'investigationStartedAt'
      | 'investigationStalledAt'
      | 'escalatedAt',
  ) {
    if (request.type !== ServiceRequestType.SECURITY_REVIEW) {
      return undefined;
    }

    const rawValue =
      request.payload != null && typeof request.payload[field] === 'string'
        ? request.payload[field]
        : undefined;
    if (!rawValue) {
      return undefined;
    }

    const parsed = new Date(rawValue);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private async notifyHeadOfficeSecurityBreach(
    requestId: string,
    breachNote: string,
  ) {
    const recipients = await this.staffModel
      .find({
        isActive: true,
        role: {
          $in: [
            UserRole.HEAD_OFFICE_OFFICER,
            UserRole.HEAD_OFFICE_MANAGER,
            UserRole.ADMIN,
          ],
        },
      })
      .select(['_id', 'role'])
      .lean<Array<{ _id: Types.ObjectId; role: UserRole }>>();

    await Promise.all(
      recipients.map((staff) =>
        this.notificationsService.notifyStaffSecurityBreachDigest({
          userId: staff._id.toString(),
          userRole: staff.role,
          serviceRequestId: requestId,
        }),
      ),
    );
  }

  private async notifySecurityInvestigationStalledEscalation(
    requestId: string,
  ) {
    const recipients = await this.staffModel
      .find({
        isActive: true,
        role: {
          $in: [UserRole.HEAD_OFFICE_MANAGER, UserRole.ADMIN],
        },
      })
      .select(['_id', 'role'])
      .lean<Array<{ _id: Types.ObjectId; role: UserRole }>>();

    await Promise.all(
      recipients.map((staff) =>
        this.notificationsService.notifyStaffSecurityInvestigationStalledDigest({
          userId: staff._id.toString(),
          userRole: staff.role,
          serviceRequestId: requestId,
        }),
      ),
    );
  }
}
