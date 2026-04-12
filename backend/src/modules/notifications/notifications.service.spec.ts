import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  UserRole,
} from '../../common/enums';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let notificationModel: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
  };
  let provider: { dispatch: jest.Mock };
  let service: NotificationsService;

  beforeEach(() => {
    notificationModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
    };
    provider = {
      dispatch: jest.fn(),
    };

    service = new NotificationsService(notificationModel as never, provider);
  });

  it('creates a notification and persists provider delivery status', async () => {
    const notificationId = new Types.ObjectId();
    provider.dispatch.mockResolvedValue({
      channel: NotificationChannel.MOBILE_PUSH,
      status: NotificationStatus.SENT,
      deliveredAt: new Date('2026-03-12T10:10:00.000Z'),
      category: 'payment',
    });
    notificationModel.create.mockResolvedValue({
      _id: notificationId,
      userType: 'member',
      userId: new Types.ObjectId(),
      type: NotificationType.PAYMENT,
      channel: NotificationChannel.MOBILE_PUSH,
      status: NotificationStatus.SENT,
      title: 'Payment complete',
      message: 'Done',
      actionLabel: 'Open payment',
      priority: 'normal',
      deepLink: '/payments/receipt_1',
    });

    const result = await service.createNotification({
      userType: 'member',
      userId: new Types.ObjectId().toString(),
      type: NotificationType.PAYMENT,
      title: 'Payment complete',
      message: 'Done',
      actionLabel: 'Open payment',
      priority: 'normal',
      deepLink: '/payments/receipt_1',
    });

    expect(provider.dispatch).toHaveBeenCalled();
    expect(notificationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationStatus.SENT,
        channel: NotificationChannel.MOBILE_PUSH,
        actionLabel: 'Open payment',
        priority: 'normal',
        deepLink: '/payments/receipt_1',
        deliveredAt: new Date('2026-03-12T10:10:00.000Z'),
      }),
    );
    expect(result.status).toBe(NotificationStatus.SENT);
    expect(result.channel).toBe(NotificationChannel.MOBILE_PUSH);
    expect(result.actionLabel).toBe('Open payment');
  });

  it('persists a failed notification when provider dispatch throws', async () => {
    provider.dispatch.mockRejectedValue(new Error('provider down'));
    notificationModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: new Types.ObjectId(),
      type: NotificationType.SYSTEM,
      channel: NotificationChannel.MOBILE_PUSH,
      status: NotificationStatus.FAILED,
      title: 'System',
      message: 'Unavailable',
    });

    const result = await service.createNotification({
      userType: 'member',
      userId: new Types.ObjectId().toString(),
      type: NotificationType.SYSTEM,
      title: 'System',
      message: 'Unavailable',
    });

    expect(notificationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: NotificationChannel.MOBILE_PUSH,
        status: NotificationStatus.FAILED,
      }),
    );
    expect(result.status).toBe(NotificationStatus.FAILED);
  });

  it('returns notifications for the current user', async () => {
    const userId = new Types.ObjectId();
    notificationModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            userType: 'member',
            userId,
            type: NotificationType.LOAN_STATUS,
            channel: NotificationChannel.MOBILE_PUSH,
            status: NotificationStatus.SENT,
            title: 'Loan',
            message: 'Updated',
          },
        ]),
      }),
    });

    const result = await service.getMyNotifications({
      sub: userId.toString(),
      role: UserRole.MEMBER,
    });

    expect(result).toHaveLength(1);
    expect(notificationModel.find).toHaveBeenCalledWith({
      userId: expect.any(Types.ObjectId),
      userType: 'member',
    });
  });

  it('marks a notification as read for the owner', async () => {
    const userId = new Types.ObjectId();
    const save = jest.fn().mockResolvedValue(undefined);
    notificationModel.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      userType: 'member',
      userId,
      type: NotificationType.SYSTEM,
      channel: NotificationChannel.MOBILE_PUSH,
      status: NotificationStatus.SENT,
      title: 'Notice',
      message: 'Read me',
      save,
    });

    const result = await service.markAsRead(
      { sub: userId.toString(), role: UserRole.MEMBER },
      new Types.ObjectId().toString(),
    );

    expect(save).toHaveBeenCalled();
    expect(result.status).toBe(NotificationStatus.READ);
  });

  it('aggregates repeated staff security breach notifications inside the digest window', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const userId = new Types.ObjectId();
    notificationModel.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        userType: 'staff',
        userId,
        userRole: UserRole.HEAD_OFFICE_MANAGER,
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.MOBILE_PUSH,
        status: NotificationStatus.SENT,
        title: 'Security review SLA breached',
        message: '1 security review SLA breach requires head office attention.',
        priority: 'high',
        dataPayload: {
          securityBreachDigestCount: 1,
          serviceRequestIds: ['req_1'],
        },
        save,
      }),
    });

    const result = await service.notifyStaffSecurityBreachDigest({
      userId: userId.toString(),
      userRole: UserRole.HEAD_OFFICE_MANAGER,
      serviceRequestId: '507f1f77bcf86cd799439011',
    });

    expect(save).toHaveBeenCalled();
    expect(result.message).toContain('2 security review SLA breaches');
    expect(result.dataPayload?.securityBreachDigestCount).toBe(2);
  });

  it('creates a fresh staff security breach notification when no digest exists', async () => {
    const notificationId = new Types.ObjectId();
    notificationModel.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });
    provider.dispatch.mockResolvedValue({
      channel: NotificationChannel.MOBILE_PUSH,
      status: NotificationStatus.SENT,
    });
    notificationModel.create.mockResolvedValue({
      _id: notificationId,
      userType: 'staff',
      userId: new Types.ObjectId(),
      userRole: UserRole.HEAD_OFFICE_MANAGER,
      type: NotificationType.SYSTEM,
      channel: NotificationChannel.MOBILE_PUSH,
      status: NotificationStatus.SENT,
      title: 'Security review SLA breached',
      message: '1 security review SLA breach requires head office attention.',
      priority: 'high',
      dataPayload: {
        securityBreachDigestCount: 1,
      },
    });

    const result = await service.notifyStaffSecurityBreachDigest({
      userId: new Types.ObjectId().toString(),
      userRole: UserRole.HEAD_OFFICE_MANAGER,
      serviceRequestId: '507f1f77bcf86cd799439011',
    });

    expect(notificationModel.create).toHaveBeenCalled();
    expect(result.title).toBe('Security review SLA breached');
  });

  it('aggregates repeated stalled-investigation notifications inside the digest window', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const userId = new Types.ObjectId();
    notificationModel.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        userType: 'staff',
        userId,
        userRole: UserRole.ADMIN,
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.MOBILE_PUSH,
        status: NotificationStatus.SENT,
        title: 'Security investigation stalled',
        message: '1 acknowledged security review still has no active investigation.',
        priority: 'high',
        dataPayload: {
          securityInvestigationStallCount: 1,
          serviceRequestIds: ['req_1'],
        },
        save,
      }),
    });

    const result = await service.notifyStaffSecurityInvestigationStalledDigest({
      userId: userId.toString(),
      userRole: UserRole.ADMIN,
      serviceRequestId: '507f1f77bcf86cd799439011',
    });

    expect(save).toHaveBeenCalled();
    expect(result.message).toContain('2 acknowledged security reviews');
    expect(result.dataPayload?.securityInvestigationStallCount).toBe(2);
  });

  it('rejects marking another user notification as read', async () => {
    notificationModel.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: new Types.ObjectId(),
      channel: NotificationChannel.MOBILE_PUSH,
      status: NotificationStatus.SENT,
      save: jest.fn(),
    });

    await expect(
      service.markAsRead(
        { sub: new Types.ObjectId().toString(), role: UserRole.MEMBER },
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('raises not found for missing notifications', async () => {
    notificationModel.findById.mockResolvedValue(null);

    await expect(
      service.markAsRead(
        { sub: new Types.ObjectId().toString(), role: UserRole.MEMBER },
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
