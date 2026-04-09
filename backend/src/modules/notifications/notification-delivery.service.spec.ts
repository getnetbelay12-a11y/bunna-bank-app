import {
  NotificationCategory,
  NotificationChannel,
  NotificationLogStatus,
  NotificationStatus,
} from '../../common/enums';
import { NotificationDeliveryService } from './notification-delivery.service';

describe('NotificationDeliveryService', () => {
  it('routes mobile push campaigns through the push provider and stores inbox records', async () => {
    const emailProvider = {
      send: jest.fn().mockResolvedValue({ status: 'sent', recipient: 'a@b.com' }),
    };
    const smsProvider = {
      send: jest.fn().mockResolvedValue({ status: 'sent', recipient: '0911' }),
    };
    const telegramProvider = {
      send: jest.fn().mockResolvedValue({ status: 'sent', recipient: '0911' }),
    };
    const mobilePushProvider = {
      send: jest.fn().mockResolvedValue({
        status: 'delivered',
        recipient: 'member_1',
      }),
    };
    const notificationsService = {
      storeNotificationRecord: jest.fn().mockResolvedValue({ id: 'notif_1' }),
    };

    const service = new NotificationDeliveryService(
      emailProvider as never,
      smsProvider as never,
      telegramProvider as never,
      mobilePushProvider as never,
      notificationsService as never,
    );

    await service.deliver({
      channel: NotificationChannel.MOBILE_PUSH,
      recipient: 'member_1',
      memberId: '65f1a8d744f0d7b7f95dd001',
      category: NotificationCategory.INSURANCE,
      subject: 'Insurance reminder',
      messageBody: 'Please renew your cover.',
    });

    expect(notificationsService.storeNotificationRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: NotificationChannel.MOBILE_PUSH,
        status: NotificationStatus.SENT,
      }),
    );
    expect(mobilePushProvider.send).toHaveBeenCalled();
    expect(service.toLogStatus({ status: 'delivered', recipient: 'x' })).toBe(
      NotificationLogStatus.DELIVERED,
    );
  });
});
