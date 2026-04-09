import { ConfigService } from '@nestjs/config';

import { NotificationCategory, NotificationChannel } from '../../../common/enums';
import { SmsNotificationProvider } from './sms-notification.provider';

describe('SmsNotificationProvider', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('fails in log mode because no real delivery occurs', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        sms: {
          enabled: true,
          provider: 'log',
          senderId: 'BUNNA_BANK',
          endpoint: '',
          apiKey: '',
        },
      }),
    } as unknown as ConfigService;

    const provider = new SmsNotificationProvider(configService);

    await expect(
      provider.send({
        channel: NotificationChannel.SMS,
        recipient: '0911000001',
        memberId: 'member_1',
        category: NotificationCategory.LOAN,
        messageBody: 'Reminder',
      }),
    ).resolves.toMatchObject({
      status: 'failed',
    });
  });

  it('posts to the configured generic endpoint', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        sms: {
          enabled: true,
          provider: 'generic_http',
          senderId: 'BUNNA_BANK',
          endpoint: 'https://sms.example.test/send',
          apiKey: 'sms-key',
        },
      }),
    } as unknown as ConfigService;

    const provider = new SmsNotificationProvider(configService);

    await expect(
      provider.send({
        channel: NotificationChannel.SMS,
        recipient: '0911000001',
        memberId: 'member_1',
        category: NotificationCategory.LOAN,
        messageBody: 'Reminder',
      }),
    ).resolves.toMatchObject({
      status: 'sent',
      recipient: '0911000001',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://sms.example.test/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sms-key',
        }),
      }),
    );
  });
});
