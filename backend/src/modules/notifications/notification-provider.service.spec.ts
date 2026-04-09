import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '../../common/enums';
import { NotificationProviderService } from './notification-provider.service';

describe('NotificationProviderService', () => {
  it('delivers through mobile push first when a device token exists', async () => {
    const memberModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'member_1',
          email: 'abebe@example.com',
          phone: '0911000001',
        }),
      }),
    };
    const pushProvider = {
      send: jest.fn().mockResolvedValue({
        status: 'sent',
        recipient: 'member_1',
      }),
    };
    const emailProvider = { send: jest.fn() };
    const smsProvider = { send: jest.fn() };

    const service = new NotificationProviderService(
      memberModel as never,
      pushProvider as never,
      emailProvider as never,
      smsProvider as never,
    );

    await expect(
      service.dispatch({
        userType: 'member',
        userId: '65f1a8d744f0d7b7f95dd001',
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Payment complete',
        message: 'Done',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        channel: NotificationChannel.MOBILE_PUSH,
        status: NotificationStatus.SENT,
      }),
    );

    expect(pushProvider.send).toHaveBeenCalled();
    expect(emailProvider.send).not.toHaveBeenCalled();
  });

  it('falls back to email when mobile push fails', async () => {
    const memberModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'member_1',
          email: 'abebe@example.com',
          phone: '0911000001',
        }),
      }),
    };
    const pushProvider = {
      send: jest.fn().mockResolvedValue({
        status: 'failed',
        recipient: 'member_1',
        errorMessage: 'No token',
      }),
    };
    const emailProvider = {
      send: jest.fn().mockResolvedValue({
        status: 'sent',
        recipient: 'abebe@example.com',
      }),
    };
    const smsProvider = { send: jest.fn() };

    const service = new NotificationProviderService(
      memberModel as never,
      pushProvider as never,
      emailProvider as never,
      smsProvider as never,
    );

    await expect(
      service.dispatch({
        userType: 'member',
        userId: '65f1a8d744f0d7b7f95dd001',
        type: NotificationType.SUPPORT_REPLY,
        title: 'Support replied',
        message: 'Open the app.',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        channel: NotificationChannel.EMAIL,
        fallbackChannel: NotificationChannel.MOBILE_PUSH,
        status: NotificationStatus.SENT,
      }),
    );
  });

  it('uses SMS as the final fallback only for critical alerts', async () => {
    const memberModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'member_1',
          email: 'abebe@example.com',
          phone: '0911000001',
        }),
      }),
    };
    const pushProvider = {
      send: jest.fn().mockResolvedValue({
        status: 'failed',
        recipient: 'member_1',
      }),
    };
    const emailProvider = {
      send: jest.fn().mockResolvedValue({
        status: 'failed',
        recipient: 'abebe@example.com',
      }),
    };
    const smsProvider = {
      send: jest.fn().mockResolvedValue({
        status: 'sent',
        recipient: '0911000001',
      }),
    };

    const service = new NotificationProviderService(
      memberModel as never,
      pushProvider as never,
      emailProvider as never,
      smsProvider as never,
    );

    await expect(
      service.dispatch({
        userType: 'member',
        userId: '65f1a8d744f0d7b7f95dd001',
        type: NotificationType.ACCOUNT_LOCKED,
        title: 'Account locked',
        message: 'Your account was locked.',
        priority: 'high',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        channel: NotificationChannel.SMS,
        fallbackChannel: NotificationChannel.MOBILE_PUSH,
        status: NotificationStatus.SENT,
      }),
    );
  });
});
