import { Logger } from '@nestjs/common';
import { NotificationCategory, NotificationChannel } from '../../../common/enums';
import { TelegramNotificationProvider } from './telegram-notification.provider';

describe('TelegramNotificationProvider', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  it('fails closed because telegram delivery is not implemented', async () => {
    const provider = new TelegramNotificationProvider();

    await expect(
      provider.send({
        channel: NotificationChannel.TELEGRAM,
        recipient: '0911000001',
        memberId: 'member_1',
        category: NotificationCategory.LOAN,
        messageBody: 'Reminder',
      }),
    ).resolves.toMatchObject({
      status: 'failed',
      recipient: '0911000001',
    });
  });
});
