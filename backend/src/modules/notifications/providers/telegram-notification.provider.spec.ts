import { NotificationCategory, NotificationChannel } from '../../../common/enums';
import { TelegramNotificationProvider } from './telegram-notification.provider';

describe('TelegramNotificationProvider', () => {
  const fetchSpy = jest.spyOn(global, 'fetch');

  afterEach(() => {
    fetchSpy.mockReset();
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  it('returns a clear failure when the bot token is missing', async () => {
    const provider = new TelegramNotificationProvider({
      get: jest.fn((key: string) => {
        switch (key) {
          case 'notifications.telegram.enabled':
            return false;
          case 'notifications.telegram.botToken':
            return '';
          case 'notifications.telegram.apiBase':
            return 'https://api.telegram.org';
          case 'notifications.telegram.forceTestChatId':
            return '';
          default:
            return undefined;
        }
      }),
    } as never);

    await expect(
      provider.send({
        channel: NotificationChannel.TELEGRAM,
        recipient: '679534336',
        memberId: 'member-1',
        category: NotificationCategory.LOAN,
        messageBody: 'Test reminder',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'failed',
        errorMessage: 'Telegram bot token is missing.',
      }),
    );
  });

  it('sends through the Telegram Bot API and returns the provider message id', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        ok: true,
        result: {
          message_id: 4242,
        },
      }),
    } as never);

    const provider = new TelegramNotificationProvider({
      get: jest.fn((key: string) => {
        switch (key) {
          case 'notifications.telegram.enabled':
            return true;
          case 'notifications.telegram.botToken':
            return 'bot-token-from-env';
          case 'notifications.telegram.apiBase':
            return 'https://api.telegram.org';
          case 'notifications.telegram.forceTestChatId':
            return '679534336';
          default:
            return undefined;
        }
      }),
    } as never);

    await expect(
      provider.send({
        channel: NotificationChannel.TELEGRAM,
        recipient: '679534336',
        memberId: 'member-1',
        category: NotificationCategory.LOAN,
        messageBody: 'Test reminder',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'sent',
        providerMessageId: '4242',
        recipient: '679534336',
      }),
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token-from-env/sendMessage',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });
});
