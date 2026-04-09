import { generateKeyPairSync } from 'node:crypto';

import { NotificationCategory, NotificationChannel } from '../../../common/enums';
import { MobilePushNotificationProvider } from './mobile-push-notification.provider';

describe('MobilePushNotificationProvider', () => {
  const fetchSpy = jest.spyOn(global, 'fetch');

  afterEach(() => {
    fetchSpy.mockReset();
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  it('sends Firebase push notifications through FCM HTTP v1', async () => {
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({ access_token: 'firebase-access-token' }),
        ),
      } as never)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            name: 'projects/demo/messages/123',
          }),
        ),
      } as never);

    const provider = new MobilePushNotificationProvider(
      {
        getOrThrow: jest.fn().mockReturnValue({
          push: {
            enabled: true,
            provider: 'firebase',
            endpoint: '',
            apiKey: '',
            iosSimulatorDevice: 'booted',
            iosSimulatorBundleId: 'com.getnetbelay.bunnaBankMobile',
            apnsTeamId: '',
            apnsKeyId: '',
            apnsBundleId: '',
            apnsPrivateKey: '',
            apnsUseSandbox: true,
            firebaseProjectId: 'bunna-bank-demo',
            firebaseClientEmail: 'firebase-adminsdk@bunna-bank-demo.iam.gserviceaccount.com',
            firebasePrivateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }),
          },
        }),
      } as never,
      {
        listForUser: jest.fn().mockResolvedValue([
          {
            platform: 'android',
            token: 'fcm-device-token',
          },
        ]),
      } as never,
    );

    const result = await provider.send({
      channel: NotificationChannel.MOBILE_PUSH,
      recipient: 'member-1',
      memberId: 'member-1',
      category: NotificationCategory.LOAN,
      subject: 'Loan reminder',
      messageBody: 'Your installment is due soon.',
      deepLink: '/loans',
      dataPayload: {
        notificationId: 'notif-1',
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: 'sent',
        recipient: 'member-1',
      }),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      'https://fcm.googleapis.com/v1/projects/bunna-bank-demo/messages:send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer firebase-access-token',
        }),
      }),
    );
  });
});
