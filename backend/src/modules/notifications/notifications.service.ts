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

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @Inject(NOTIFICATION_PROVIDER_PORT)
    private readonly notificationProvider: NotificationProviderPort,
  ) {}

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationResult> {
    let delivered = false;

    try {
      delivered = await this.notificationProvider.dispatch({
        userType: dto.userType,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
      });
    } catch (error) {
      this.logger.warn(
        `Notification dispatch failed for ${dto.userType}:${dto.userId}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    const notification = await this.notificationModel.create({
      userType: dto.userType,
      userId: new Types.ObjectId(dto.userId),
      userRole: dto.userRole,
      type: dto.type,
      status:
        dto.status ??
        (delivered ? NotificationStatus.SENT : NotificationStatus.FAILED),
      title: dto.title,
      message: dto.message,
      entityType: dto.entityType,
      entityId: dto.entityId ? new Types.ObjectId(dto.entityId) : undefined,
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
      status: notification.status,
      title: notification.title,
      message: notification.message,
      entityType: notification.entityType,
      entityId: notification.entityId?.toString(),
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
