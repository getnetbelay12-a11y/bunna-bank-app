import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import {
  NotificationStatus,
  NotificationChannel,
  NotificationType,
  UserRole,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { CreateNotificationDto, ListNotificationsQueryDto } from './dto';
import { NotificationResult } from './interfaces';
import {
  NOTIFICATION_PROVIDER_PORT,
  NotificationProviderPort,
} from './notification-provider.port';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private static readonly SECURITY_BREACH_DIGEST_WINDOW_MS = 15 * 60 * 1000;
  private static readonly SECURITY_STALL_DIGEST_WINDOW_MS = 15 * 60 * 1000;

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @Inject(NOTIFICATION_PROVIDER_PORT)
    private readonly notificationProvider: NotificationProviderPort,
  ) {}

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationResult> {
    let dispatchResult:
      | {
          channel: NotificationChannel;
          status: NotificationStatus;
          deliveredAt?: Date;
        }
      | undefined;

    try {
      dispatchResult = await this.notificationProvider.dispatch({
        userType: dto.userType,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        priority: dto.priority,
        actionLabel: dto.actionLabel,
        deepLink: dto.deepLink,
        dataPayload: dto.dataPayload,
        preferredChannel: dto.channel,
      });
    } catch (error) {
      this.logger.warn(
        `Notification dispatch failed for ${dto.userType}:${dto.userId}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return this.storeNotificationRecord({
      ...dto,
      channel:
        dto.channel ??
        dispatchResult?.channel ??
        NotificationChannel.MOBILE_PUSH,
      status: dto.status ?? dispatchResult?.status ?? NotificationStatus.FAILED,
      deliveredAt: dispatchResult?.deliveredAt,
    });
  }

  async notifyStaffSecurityBreachDigest(input: {
    userId: string;
    userRole: UserRole;
    serviceRequestId: string;
  }): Promise<NotificationResult> {
    const cutoff = new Date(
      Date.now() - NotificationsService.SECURITY_BREACH_DIGEST_WINDOW_MS,
    );
    const existing = await this.notificationModel
      .findOne({
        userType: 'staff',
        userId: new Types.ObjectId(input.userId),
        type: NotificationType.SYSTEM,
        title: 'Security review SLA breached',
        priority: 'high',
        status: { $ne: NotificationStatus.READ },
        createdAt: { $gte: cutoff },
      })
      .sort({ createdAt: -1 });

    if (!existing) {
      return this.createNotification({
        userType: 'staff',
        userId: input.userId,
        userRole: input.userRole,
        type: NotificationType.SYSTEM,
        title: 'Security review SLA breached',
        message: '1 security review SLA breach requires head office attention.',
        entityType: 'service_request',
        entityId: input.serviceRequestId,
        actionLabel: 'Open security review',
        priority: 'high',
        deepLink: '/console/head-office?section=serviceRequests',
        dataPayload: {
          securityBreachDigestCount: 1,
          serviceRequestIds: [input.serviceRequestId],
          latestServiceRequestId: input.serviceRequestId,
          escalationState: 'breached_head_office_attention_required',
        },
      });
    }

    const currentIds = Array.isArray(existing.dataPayload?.serviceRequestIds)
      ? existing.dataPayload?.serviceRequestIds.filter(
          (value): value is string => typeof value === 'string' && value.trim().length > 0,
        )
      : [];
    const nextIds = Array.from(new Set([...currentIds, input.serviceRequestId]));
    const nextCount =
      typeof existing.dataPayload?.securityBreachDigestCount === 'number'
        ? Math.max(existing.dataPayload.securityBreachDigestCount, nextIds.length)
        : nextIds.length;

    existing.message = `${nextCount} security review SLA breaches require head office attention.`;
    existing.entityType = 'service_request';
    existing.entityId = new Types.ObjectId(input.serviceRequestId);
    existing.actionLabel = 'Open security review';
    existing.priority = 'high';
    existing.deepLink = '/console/head-office?section=serviceRequests';
    existing.dataPayload = {
      ...(existing.dataPayload ?? {}),
      securityBreachDigestCount: nextCount,
      serviceRequestIds: nextIds,
      latestServiceRequestId: input.serviceRequestId,
      escalationState: 'breached_head_office_attention_required',
    };
    await existing.save();

    return this.toResult(existing);
  }

  async notifyStaffSecurityInvestigationStalledDigest(input: {
    userId: string;
    userRole: UserRole;
    serviceRequestId: string;
  }): Promise<NotificationResult> {
    const cutoff = new Date(
      Date.now() - NotificationsService.SECURITY_STALL_DIGEST_WINDOW_MS,
    );
    const existing = await this.notificationModel
      .findOne({
        userType: 'staff',
        userId: new Types.ObjectId(input.userId),
        type: NotificationType.SYSTEM,
        title: 'Security investigation stalled',
        priority: 'high',
        status: { $ne: NotificationStatus.READ },
        createdAt: { $gte: cutoff },
      })
      .sort({ createdAt: -1 });

    if (!existing) {
      return this.createNotification({
        userType: 'staff',
        userId: input.userId,
        userRole: input.userRole,
        type: NotificationType.SYSTEM,
        title: 'Security investigation stalled',
        message: '1 acknowledged security review still has no active investigation.',
        entityType: 'service_request',
        entityId: input.serviceRequestId,
        actionLabel: 'Open stalled review',
        priority: 'high',
        deepLink: '/console/head-office?section=serviceRequests',
        dataPayload: {
          securityInvestigationStallCount: 1,
          serviceRequestIds: [input.serviceRequestId],
          latestServiceRequestId: input.serviceRequestId,
          escalationState: 'acknowledged_but_investigation_not_started',
        },
      });
    }

    const currentIds = Array.isArray(existing.dataPayload?.serviceRequestIds)
      ? existing.dataPayload?.serviceRequestIds.filter(
          (value): value is string => typeof value === 'string' && value.trim().length > 0,
        )
      : [];
    const nextIds = Array.from(new Set([...currentIds, input.serviceRequestId]));
    const nextCount =
      typeof existing.dataPayload?.securityInvestigationStallCount === 'number'
        ? Math.max(existing.dataPayload.securityInvestigationStallCount, nextIds.length)
        : nextIds.length;

    existing.message = `${nextCount} acknowledged security reviews still have no active investigation.`;
    existing.entityType = 'service_request';
    existing.entityId = new Types.ObjectId(input.serviceRequestId);
    existing.actionLabel = 'Open stalled review';
    existing.priority = 'high';
    existing.deepLink = '/console/head-office?section=serviceRequests';
    existing.dataPayload = {
      ...(existing.dataPayload ?? {}),
      securityInvestigationStallCount: nextCount,
      serviceRequestIds: nextIds,
      latestServiceRequestId: input.serviceRequestId,
      escalationState: 'acknowledged_but_investigation_not_started',
    };
    await existing.save();

    return this.toResult(existing);
  }

  async storeNotificationRecord(
    dto: CreateNotificationDto & {
      deliveredAt?: Date;
    },
  ): Promise<NotificationResult> {
    const notification = await this.notificationModel.create({
      userType: dto.userType,
      userId: new Types.ObjectId(dto.userId),
      userRole: dto.userRole,
      type: dto.type,
      channel: dto.channel ?? NotificationChannel.MOBILE_PUSH,
      status: dto.status ?? NotificationStatus.PENDING,
      title: dto.title,
      message: dto.message,
      entityType: dto.entityType,
      entityId: dto.entityId ? new Types.ObjectId(dto.entityId) : undefined,
      actionLabel: dto.actionLabel,
      priority: dto.priority,
      deepLink: dto.deepLink,
      dataPayload: dto.dataPayload,
      deliveredAt: dto.deliveredAt,
    });

    return this.toResult(notification);
  }

  async getMyNotifications(
    currentUser: AuthenticatedUser,
  ): Promise<NotificationResult[]> {
    return this.listNotifications({
      userId: currentUser.sub,
      userType: this.resolveUserType(currentUser.role),
    });
  }

  async listNotifications(
    query: ListNotificationsQueryDto,
    currentUser?: AuthenticatedUser,
  ): Promise<NotificationResult[]> {
    if (currentUser && !this.isStaffRole(currentUser.role)) {
      throw new ForbiddenException('Only staff users can list notifications by user.');
    }

    const filter: FilterQuery<NotificationDocument> = {};

    if (query.userId) {
      filter.userId = new Types.ObjectId(query.userId);
    }
    if (query.userType) {
      filter.userType = query.userType;
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const notifications = await this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean<NotificationDocument[]>();

    return notifications.map((notification) => this.toResult(notification));
  }

  async markAsRead(
    currentUser: AuthenticatedUser,
    notificationId: string,
  ): Promise<NotificationResult> {
    const notification = await this.notificationModel.findById(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    const expectedUserType = this.resolveUserType(currentUser.role);
    if (
      notification.userId.toString() !== currentUser.sub ||
      notification.userType !== expectedUserType
    ) {
      throw new ForbiddenException('Notification does not belong to the current user.');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    await notification.save();

    return this.toResult(notification);
  }

  private resolveUserType(role: UserRole): 'member' | 'staff' {
    return role === UserRole.MEMBER || role === UserRole.SHAREHOLDER_MEMBER
      ? 'member'
      : 'staff';
  }

  private isStaffRole(role: UserRole): boolean {
    return this.resolveUserType(role) === 'staff';
  }

  private toResult(
    notification: NotificationDocument | (NotificationDocument & { id?: string }),
  ): NotificationResult {
    return {
      id: notification.id ?? notification._id.toString(),
      userType: notification.userType,
      userId: notification.userId.toString(),
      userRole: notification.userRole,
      type: notification.type as NotificationType,
      channel: (notification.channel ??
        NotificationChannel.MOBILE_PUSH) as NotificationChannel,
      status: notification.status,
      title: notification.title,
      message: notification.message,
      entityType: notification.entityType,
      entityId: notification.entityId?.toString(),
      actionLabel: notification.actionLabel,
      priority: notification.priority,
      deepLink: notification.deepLink,
      dataPayload: notification.dataPayload,
      readAt: notification.readAt,
      deliveredAt: notification.deliveredAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
