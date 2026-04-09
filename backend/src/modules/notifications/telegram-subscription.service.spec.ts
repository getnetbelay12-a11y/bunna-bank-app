import { Types } from 'mongoose';

import { UserRole } from '../../common/enums';
import { TelegramSubscriptionService } from './telegram-subscription.service';

describe('TelegramSubscriptionService', () => {
  let memberModel: {
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    updateMany: jest.Mock;
  };
  let telegramLinkCodeModel: {
    create: jest.Mock;
    deleteMany: jest.Mock;
    findOne: jest.Mock;
  };
  let provider: {
    sendTextMessage: jest.Mock;
  };
  let emailNotificationProvider: {
    send: jest.Mock;
  };
  let service: TelegramSubscriptionService;

  beforeEach(() => {
    memberModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateMany: jest.fn(),
    };
    telegramLinkCodeModel = {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findOne: jest.fn(),
    };
    provider = {
      sendTextMessage: jest.fn().mockResolvedValue({
        status: 'sent',
        recipient: '679534336',
      }),
    };
    emailNotificationProvider = {
      send: jest.fn().mockResolvedValue({
        status: 'sent',
        recipient: 'write2get@gmail.com',
      }),
    };

    service = new TelegramSubscriptionService(
      memberModel as never,
      telegramLinkCodeModel as never,
      {
        get: jest.fn((key: string) => {
          if (key === 'notifications.telegram.webhookSecret') {
            return 'hook-secret';
          }
          if (key === 'notifications.email.testRecipient') {
            return 'write2get@gmail.com';
          }
          return undefined;
        }),
      } as never,
      emailNotificationProvider as never,
      provider as never,
    );
  });

  it('creates a Telegram link code for a member', async () => {
    memberModel.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      customerId: 'BUN-100001',
      fullName: 'Abebe Kebede',
      email: 'abebe@example.com',
      telegramSubscribed: false,
      optInLoanReminders: true,
      optInInsuranceReminders: true,
    });

    const result = await service.createLinkCode(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.MEMBER,
      },
      15,
    );

    expect(result.code).toMatch(/^[A-F0-9]{8}$/);
    expect(telegramLinkCodeModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'BUN-100001',
        code: result.code,
      }),
    );
    expect(emailNotificationProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'write2get@gmail.com',
        subject: 'Your Bunna Bank Telegram Link Code',
      }),
    );
    expect(result.emailedTo).toBe('write2get@gmail.com');
  });

  it('links a Telegram chat id from a valid /link code', async () => {
    const saveMember = jest.fn().mockResolvedValue(undefined);
    const saveLink = jest.fn().mockResolvedValue(undefined);
    const member: Record<string, unknown> = {
      _id: new Types.ObjectId(),
      customerId: 'BUN-100001',
      telegramLinkedAt: undefined,
      save: saveMember,
    };

    telegramLinkCodeModel.findOne.mockResolvedValue({
      memberId: member._id,
      save: saveLink,
    });
    memberModel.findById.mockResolvedValue(member);

    const result = await service.handleWebhook(
      {
        message: {
          chat: { id: 679534336 },
          from: {
            id: 111,
            username: 'bunna_user',
            first_name: 'Abebe',
            last_name: 'Kebede',
          },
          text: '/link ABC12345',
        },
      },
      'hook-secret',
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        handled: true,
        action: 'linked',
        customerId: 'BUN-100001',
      }),
    );
    expect(member.telegramChatId).toBe('679534336');
    expect(member.telegramSubscribed).toBe(true);
    expect(saveMember).toHaveBeenCalled();
    expect(saveLink).toHaveBeenCalled();
  });
});
