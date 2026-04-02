import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationType } from '../../common/enums';
import { NotificationProviderService } from './notification-provider.service';

describe('NotificationProviderService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
  });

  it('returns true when outbound channels are disabled', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        sms: { enabled: false, provider: 'log', senderId: '', endpoint: '', apiKey: '' },
        email: {
          enabled: false,
          provider: 'log',
          sender: '',
          endpoint: '',
          apiKey: '',
          smtpHost: '',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: '',
          smtpPass: '',
        },
        push: {
          enabled: false,
          provider: 'log',
          endpoint: '',
          apiKey: '',
          firebaseProjectId: '',
          firebaseClientEmail: '',
          firebasePrivateKey: '',
        },
      }),
    } as unknown as ConfigService;

    const service = new NotificationProviderService(configService);

    await expect(
      service.dispatch({
        userType: 'member',
        userId: 'member_1',
        type: NotificationType.SYSTEM,
        title: 'Notice',
        message: 'Hello',
      }),
    ).resolves.toBe(true);
  });

  it('uses generic HTTP provider when configured', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 } as Response);

    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        sms: {
          enabled: true,
          provider: 'generic_http',
          senderId: 'CBE_BANK',
          endpoint: 'https://sms.example.test/send',
          apiKey: 'key-1',
        },
        email: {
          enabled: false,
          provider: 'log',
          sender: '',
          endpoint: '',
          apiKey: '',
          smtpHost: '',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: '',
          smtpPass: '',
        },
        push: {
          enabled: false,
          provider: 'log',
          endpoint: '',
          apiKey: '',
          firebaseProjectId: '',
          firebaseClientEmail: '',
          firebasePrivateKey: '',
        },
      }),
    } as unknown as ConfigService;

    const service = new NotificationProviderService(configService);

    await expect(
      service.dispatch({
        userType: 'member',
        userId: 'member_2',
        type: NotificationType.PAYMENT,
        title: 'Payment',
        message: 'Done',
      }),
    ).resolves.toBe(true);

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://sms.example.test/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer key-1',
        }),
      }),
    );
  });

  it('returns false when firebase is enabled without credentials', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        sms: { enabled: false, provider: 'log', senderId: '', endpoint: '', apiKey: '' },
        email: {
          enabled: false,
          provider: 'log',
          sender: '',
          endpoint: '',
          apiKey: '',
          smtpHost: '',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: '',
          smtpPass: '',
        },
        push: {
          enabled: true,
          provider: 'firebase',
          endpoint: '',
          apiKey: '',
          firebaseProjectId: '',
          firebaseClientEmail: '',
          firebasePrivateKey: '',
        },
      }),
    } as unknown as ConfigService;

    const service = new NotificationProviderService(configService);

    await expect(
      service.dispatch({
        userType: 'staff',
        userId: 'staff_1',
        type: NotificationType.LOAN_STATUS,
        title: 'Loan',
        message: 'Updated',
      }),
    ).resolves.toBe(false);
  });
});
