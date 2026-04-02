import { NotificationCategory, NotificationChannel, NotificationLogStatus } from '../../common/enums';
import { NotificationDeliveryService } from './notification-delivery.service';

describe('NotificationDeliveryService', () => {
  it('routes by channel and creates in-app notification records', async () => {
    const emailProvider = { send: jest.fn().mockResolvedValue({ status: 'sent', recipient: 'a@b.com' }) };
    const smsProvider = { send: jest.fn().mockResolvedValue({ status: 'sent', recipient: '0911' }) };
    const telegramProvider = { send: jest.fn().mockResolvedValue({ status: 'sent', recipient: '0911' }) };
    const inAppProvider = { send: jest.fn().mockResolvedValue({ status: 'delivered', recipient: '0911' }) };
    const notificationsService = { createNotification: jest.fn().mockResolvedValue({ id: 'notif_1' }) };

    const service = new NotificationDeliveryService(
      emailProvider as never,
      smsProvider as never,
      telegramProvider as never,
      inAppProvider as never,
      notificationsService as never,
    );

    await service.deliver({
      channel: NotificationChannel.IN_APP,
      recipient: '0911000001',
      memberId: '65f1a8d744f0d7b7f95dd001',
      category: NotificationCategory.INSURANCE,
      subject: 'Insurance reminder',
      messageBody: 'Please renew your cover.',
    });

    expect(notificationsService.createNotification).toHaveBeenCalled();
    expect(inAppProvider.send).toHaveBeenCalled();
    expect(service.toLogStatus({ status: 'delivered', recipient: 'x' })).toBe(
      NotificationLogStatus.DELIVERED,
    );
  });
});
