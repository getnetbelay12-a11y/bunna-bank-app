import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import {
  NotificationStatus,
  NotificationType,
  UserRole,
} from '../../common/enums';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let notificationModel: {
    create: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
  };
  let provider: { dispatch: jest.Mock };
  let service: NotificationsService;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    notificationModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };
    provider = {
      dispatch: jest.fn(),
    };

    service = new NotificationsService(notificationModel as never, provider);
  });

  it('creates a notification and persists provider delivery status', async () => {
    const notificationId = new Types.ObjectId();
    provider.dispatch.mockResolvedValue(true);
    notificationModel.create.mockResolvedValue({
      _id: notificationId,
      userType: 'member',
      userId: new Types.ObjectId(),
      type: NotificationType.PAYMENT,
      status: NotificationStatus.SENT,
      title: 'Payment complete',
      message: 'Done',
    });

    const result = await service.createNotification({
      userType: 'member',
      userId: new Types.ObjectId().toString(),
      type: NotificationType.PAYMENT,
      title: 'Payment complete',
      message: 'Done',
    });

    expect(provider.dispatch).toHaveBeenCalled();
    expect(notificationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: NotificationStatus.SENT }),
    );
    expect(result.status).toBe(NotificationStatus.SENT);
  });

  it('persists a failed notification when provider dispatch throws', async () => {
    provider.dispatch.mockRejectedValue(new Error('provider down'));
    notificationModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: new Types.ObjectId(),
      type: NotificationType.SYSTEM,
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
      expect.objectContaining({ status: NotificationStatus.FAILED }),
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

  it('rejects marking another user notification as read', async () => {
    notificationModel.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      userType: 'member',
      userId: new Types.ObjectId(),
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
