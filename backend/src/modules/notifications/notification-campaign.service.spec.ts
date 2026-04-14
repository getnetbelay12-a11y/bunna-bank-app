import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import {
  NotificationCampaignStatus,
  NotificationCategory,
  NotificationChannel,
  NotificationLogStatus,
  UserRole,
} from '../../common/enums';
import { NotificationCampaignService } from './notification-campaign.service';

describe('NotificationCampaignService', () => {
  let campaignModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
  };
  let logModel: {
    insertMany: jest.Mock;
    find: jest.Mock;
  };
  let memberModel: {
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let autopaySettingModel: {
    exists: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let templateService: {
    getTemplateByType: jest.Mock;
  };
  let deliveryService: {
    deliver: jest.Mock;
    toLogStatus: jest.Mock;
  };
  let templateRendererService: {
    render: jest.Mock;
  };
  let notificationsService: {
    storeNotificationRecord: jest.Mock;
  };
  let service: NotificationCampaignService;

  beforeEach(() => {
    campaignModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };
    logModel = {
      insertMany: jest.fn(),
      find: jest.fn(),
    };
    memberModel = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    autopaySettingModel = {
      exists: jest.fn().mockResolvedValue(null),
    };
    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'notifications.email.testRecipient':
            return 'write2get@gmail.com';
          case 'notifications.email.forceTestRecipient':
            return 'write2get@gmail.com';
          case 'notifications.telegram.forceTestChatId':
            return '679534336';
          case 'app.demoMode':
            return true;
          case 'app.nodeEnv':
            return 'development';
          default:
            return undefined;
        }
      }),
    };
    templateService = {
      getTemplateByType: jest.fn().mockResolvedValue({
        subject: 'Reminder',
        messageBody: 'Template message',
      }),
    };
    deliveryService = {
      deliver: jest.fn().mockResolvedValue({
        status: 'sent',
        providerMessageId: 'provider-1',
        recipient: '0911000001',
      }),
      toLogStatus: jest.fn().mockReturnValue(NotificationLogStatus.SENT),
    };
    templateRendererService = {
      render: jest.fn().mockReturnValue({
        subject: 'Rendered reminder',
        emailHtml: '<html></html>',
        emailText: 'Rendered email',
        inAppTitle: 'Loan Payment Reminder',
        inAppMessage: 'Rendered in-app',
        smsMessage: 'Rendered SMS',
        telegramMessage: 'Rendered Telegram',
        logMessageBody: 'Rendered log body',
      }),
    };
    notificationsService = {
      storeNotificationRecord: jest.fn().mockResolvedValue({}),
    };

    service = new NotificationCampaignService(
      campaignModel as never,
      logModel as never,
      memberModel as never,
      autopaySettingModel as never,
      configService as never,
      templateService as never,
      deliveryService as never,
      templateRendererService as never,
      notificationsService as never,
    );
  });

  it('creates a campaign for a unique branch-scoped member list', async () => {
    const memberId = new Types.ObjectId();
    memberModel.find.mockResolvedValue([
      {
        _id: memberId,
        branchId: new Types.ObjectId('65f1a8d744f0d7b7f95dd001'),
        districtId: new Types.ObjectId(),
      },
    ]);
    campaignModel.create.mockResolvedValue({ _id: new Types.ObjectId() });

    await service.createCampaign(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.BRANCH_MANAGER,
        branchId: '65f1a8d744f0d7b7f95dd001',
      },
      {
        category: NotificationCategory.LOAN,
        templateType: 'loan_due_soon' as never,
        channels: [NotificationChannel.SMS],
        targetType: 'selected_customers',
        targetIds: [memberId.toString()],
      },
    );

    expect(memberModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId: expect.any(Types.ObjectId),
        $or: expect.arrayContaining([
          expect.objectContaining({
            _id: expect.any(Types.ObjectId),
          }),
        ]),
      }),
    );
    expect(campaignModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          demoRecipientEmail: 'write2get@gmail.com',
        }),
        status: NotificationCampaignStatus.DRAFT,
      }),
    );
  });

  it('accepts customer ids like BUN-100001 in selected customer targeting', async () => {
    const memberId = new Types.ObjectId();
    memberModel.find.mockResolvedValue([
      {
        _id: memberId,
        customerId: 'BUN-100001',
        memberNumber: 'BUN-100001',
        phone: '0911000001',
        branchId: new Types.ObjectId('65f1a8d744f0d7b7f95dd001'),
        districtId: new Types.ObjectId(),
      },
    ]);
    campaignModel.create.mockResolvedValue({ _id: new Types.ObjectId() });

    await service.createCampaign(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.BRANCH_MANAGER,
        branchId: '65f1a8d744f0d7b7f95dd001',
      },
      {
        category: NotificationCategory.LOAN,
        templateType: 'loan_due_soon' as never,
        channels: [NotificationChannel.EMAIL, NotificationChannel.TELEGRAM],
        targetType: 'selected_customers',
        targetIds: ['BUN-100001'],
      },
    );

    expect(memberModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId: expect.any(Types.ObjectId),
        $or: expect.arrayContaining([
          expect.objectContaining({
            customerId: { $in: ['BUN-100001'] },
          }),
          expect.objectContaining({
            memberNumber: { $in: ['BUN-100001'] },
          }),
        ]),
      }),
    );
  });

  it('preserves explicit email-only channels when creating a campaign', async () => {
    const memberId = new Types.ObjectId();
    memberModel.find.mockResolvedValue([
      {
        _id: memberId,
        customerId: 'BUN-100001',
        memberNumber: 'BUN-100001',
        phone: '0911000001',
        branchId: new Types.ObjectId('65f1a8d744f0d7b7f95dd001'),
        districtId: new Types.ObjectId(),
      },
    ]);
    campaignModel.create.mockResolvedValue({ _id: new Types.ObjectId() });

    await service.createCampaign(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
      },
      {
        category: NotificationCategory.LOAN,
        templateType: 'loan_due_soon' as never,
        channels: [NotificationChannel.EMAIL],
        targetType: 'selected_customers',
        targetIds: ['BUN-100001'],
      },
    );

    expect(campaignModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channels: [NotificationChannel.EMAIL],
      }),
    );
  });

  it('blocks campaign creation when branch manager targets outside branch scope', async () => {
    memberModel.find.mockResolvedValue([]);

    await expect(
      service.createCampaign(
        {
          sub: new Types.ObjectId().toString(),
          role: UserRole.BRANCH_MANAGER,
          branchId: '65f1a8d744f0d7b7f95dd001',
        },
        {
          category: NotificationCategory.INSURANCE,
          templateType: 'insurance_expired' as never,
          channels: [NotificationChannel.EMAIL],
          targetType: 'selected_customers',
          targetIds: [new Types.ObjectId().toString()],
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks district manager targeting outside district scope through filters', async () => {
    memberModel.find.mockResolvedValue([]);

    await expect(
      service.createCampaign(
        {
          sub: new Types.ObjectId().toString(),
          role: UserRole.DISTRICT_MANAGER,
          districtId: '65f1a8d744f0d7b7f95dd111',
        },
        {
          category: NotificationCategory.INSURANCE,
          templateType: 'insurance_expiring_30_days' as never,
          channels: [NotificationChannel.EMAIL],
          targetType: 'filtered_customers',
          filters: {
            branchId: '65f1a8d744f0d7b7f95dd999',
          },
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows head office manager to target institution-wide members', async () => {
    memberModel.find.mockResolvedValue([
      {
        _id: new Types.ObjectId(),
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
      },
    ]);
    campaignModel.create.mockResolvedValue({ _id: new Types.ObjectId() });

    await service.createCampaign(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
      },
      {
        category: NotificationCategory.LOAN,
        templateType: 'loan_approved' as never,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        targetType: 'filtered_customers',
        filters: {},
      },
    );

    expect(memberModel.find).toHaveBeenCalledWith({});
  });

  it('creates notification logs when a campaign is sent', async () => {
    const memberId = new Types.ObjectId();
    const campaign = {
      _id: new Types.ObjectId(),
      targetIds: [memberId],
      channels: [NotificationChannel.SMS, NotificationChannel.IN_APP],
      category: NotificationCategory.LOAN,
      messageSubject: 'Reminder',
      messageBody: 'Pay soon',
      status: NotificationCampaignStatus.DRAFT,
      save: jest.fn().mockResolvedValue(undefined),
    };
    campaignModel.findOne.mockResolvedValue(campaign);
    memberModel.find.mockResolvedValue([
      {
        _id: memberId,
        phone: '0911000001',
        telegramChatId: '673456789',
        email: 'member@example.com',
        role: UserRole.MEMBER,
      },
    ]);

    await service.sendCampaign(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
      },
      campaign._id.toString(),
    );

    expect(deliveryService.deliver).toHaveBeenCalledTimes(2);
    expect(templateRendererService.render).toHaveBeenCalled();
    expect(logModel.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          channel: NotificationChannel.SMS,
          status: NotificationLogStatus.SENT,
        }),
      ]),
    );
  });

  it('adds the local demo push member when a mobile push campaign targets a different member', async () => {
    const selectedMemberId = new Types.ObjectId();
    const forcedDemoMemberId = new Types.ObjectId();
    memberModel.find.mockResolvedValue([
      {
        _id: selectedMemberId,
        customerId: 'BUN-100003',
        memberNumber: 'BUN-100003',
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
      },
    ]);
    memberModel.findOne.mockResolvedValue({
      _id: forcedDemoMemberId,
      customerId: 'BUN-100001',
      memberNumber: 'BUN-100001',
      branchId: new Types.ObjectId(),
      districtId: new Types.ObjectId(),
    });
    campaignModel.create.mockResolvedValue({ _id: new Types.ObjectId() });

    await service.createCampaign(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
      },
      {
        category: NotificationCategory.LOAN,
        templateType: 'loan_due_soon' as never,
        channels: [NotificationChannel.MOBILE_PUSH],
        targetType: 'selected_customers',
        targetIds: ['BUN-100003'],
      },
    );

    expect(memberModel.findOne).toHaveBeenCalledWith({
      $or: [{ customerId: 'BUN-100001' }, { memberNumber: 'BUN-100001' }],
    });
    expect(campaignModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetIds: [selectedMemberId, forcedDemoMemberId],
      }),
    );
  });

  it('stores a school payment due mobile notification with school pay deep link', async () => {
    const memberId = new Types.ObjectId();
    const campaign = {
      _id: new Types.ObjectId(),
      templateType: 'school_payment_due',
      targetIds: [memberId],
      channels: [NotificationChannel.MOBILE_PUSH],
      category: NotificationCategory.PAYMENT,
      messageSubject: 'School Fee Reminder',
      messageBody: 'School fee of ETB 5000 is due on March 5. Open the app and pay now.',
      status: NotificationCampaignStatus.DRAFT,
      save: jest.fn().mockResolvedValue(undefined),
    };
    campaignModel.findOne.mockResolvedValue(campaign);
    memberModel.find.mockResolvedValue([
      {
        _id: memberId,
        phone: '0911000001',
        email: 'member@example.com',
        role: UserRole.MEMBER,
      },
    ]);
    deliveryService.deliver.mockResolvedValue({
      status: 'sent',
      providerMessageId: 'push-1',
      recipient: memberId.toString(),
    });

    await service.sendCampaign(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.HEAD_OFFICE_MANAGER,
      },
      campaign._id.toString(),
    );

    expect(deliveryService.deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: NotificationChannel.MOBILE_PUSH,
        createInAppRecord: false,
      }),
    );
    expect(notificationsService.storeNotificationRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'school_payment_due',
        entityType: 'school_payment',
        actionLabel: 'Pay now',
        deepLink: '/payments/school',
        dataPayload: expect.objectContaining({
          serviceType: 'school_payment',
          autoPayEnabled: false,
        }),
      }),
    );
  });

  it('sends email and telegram together while using the local telegram test chat override', async () => {
    const memberId = new Types.ObjectId();
    const campaign = {
      _id: new Types.ObjectId(),
      templateType: 'loan_due_soon',
      targetIds: [memberId],
      channels: [NotificationChannel.EMAIL, NotificationChannel.TELEGRAM],
      category: NotificationCategory.LOAN,
      messageSubject: 'Loan Due Soon Reminder',
      messageBody: 'Your installment is approaching its due date.',
      filters: { demoRecipientEmail: 'write2get@gmail.com' },
      status: NotificationCampaignStatus.DRAFT,
      save: jest.fn().mockResolvedValue(undefined),
    };
    campaignModel.findOne.mockResolvedValue(campaign);
    memberModel.find.mockResolvedValue([
      {
        _id: memberId,
        phone: '0911000001',
        email: 'member@example.com',
        telegramChatId: '999000111',
        role: UserRole.MEMBER,
      },
    ]);
    deliveryService.deliver
      .mockResolvedValueOnce({
        status: 'sent',
        providerMessageId: 'email-123',
        recipient: 'write2get@gmail.com',
      })
      .mockResolvedValueOnce({
        status: 'sent',
        providerMessageId: 'telegram-123',
        recipient: '679534336',
      });
    deliveryService.toLogStatus.mockReturnValue(NotificationLogStatus.SENT);

    const result = await service.sendCampaign(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.ADMIN,
      },
      campaign._id.toString(),
    );

    expect(deliveryService.deliver).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        channel: NotificationChannel.EMAIL,
        recipient: 'write2get@gmail.com',
      }),
    );
    expect(deliveryService.deliver).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        channel: NotificationChannel.TELEGRAM,
        recipient: '679534336',
        messageBody: 'Rendered Telegram',
      }),
    );
    expect(logModel.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          channel: NotificationChannel.EMAIL,
          recipient: 'write2get@gmail.com',
          status: NotificationLogStatus.SENT,
        }),
        expect.objectContaining({
          channel: NotificationChannel.TELEGRAM,
          recipient: '679534336',
          status: NotificationLogStatus.SENT,
        }),
      ]),
    );
    expect(result.status).toBe(NotificationCampaignStatus.COMPLETED);
  });

  it('sends email reminder campaigns through the forced local test recipient', async () => {
    const memberId = new Types.ObjectId();
    const campaign = {
      _id: new Types.ObjectId(),
      templateType: 'loan_due_soon',
      targetIds: [memberId],
      channels: [NotificationChannel.EMAIL],
      category: NotificationCategory.LOAN,
      messageSubject: 'Loan Due Soon Reminder',
      messageBody: 'Your installment is approaching its due date.',
      filters: { demoRecipientEmail: 'write2get@gmail.com' },
      status: NotificationCampaignStatus.DRAFT,
      save: jest.fn().mockResolvedValue(undefined),
    };
    campaignModel.findOne.mockResolvedValue(campaign);
    memberModel.find.mockResolvedValue([
      {
        _id: memberId,
        phone: '0911000001',
        email: 'member@example.com',
        role: UserRole.MEMBER,
      },
    ]);
    deliveryService.deliver.mockResolvedValue({
      status: 'sent',
      providerMessageId: 'log-123',
      recipient: 'write2get@gmail.com',
    });
    deliveryService.toLogStatus.mockReturnValue(NotificationLogStatus.SENT);

    const result = await service.sendCampaign(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.ADMIN,
      },
      campaign._id.toString(),
    );

    expect(deliveryService.deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: NotificationChannel.EMAIL,
        recipient: 'write2get@gmail.com',
        subject: 'Rendered reminder',
      }),
    );
    expect(logModel.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          channel: NotificationChannel.EMAIL,
          recipient: 'write2get@gmail.com',
          status: NotificationLogStatus.SENT,
          providerMessageId: 'log-123',
        }),
      ]),
    );
    expect(result.status).toBe(NotificationCampaignStatus.COMPLETED);
  });

  it('keeps mobile push delivery for all targeted members when forced demo email is enabled', async () => {
    const firstMemberId = new Types.ObjectId();
    const secondMemberId = new Types.ObjectId();
    const campaign = {
      _id: new Types.ObjectId(),
      templateType: 'loan_due_soon',
      targetIds: [firstMemberId, secondMemberId],
      channels: [NotificationChannel.EMAIL, NotificationChannel.MOBILE_PUSH],
      category: NotificationCategory.LOAN,
      messageSubject: 'Loan Due Soon Reminder',
      messageBody: 'Your installment is approaching its due date.',
      filters: { demoRecipientEmail: 'write2get@gmail.com' },
      status: NotificationCampaignStatus.DRAFT,
      save: jest.fn().mockResolvedValue(undefined),
    };
    campaignModel.findOne.mockResolvedValue(campaign);
    memberModel.find.mockResolvedValue([
      {
        _id: firstMemberId,
        phone: '0911000001',
        email: 'member1@example.com',
        role: UserRole.MEMBER,
        customerId: 'BUN-100001',
      },
      {
        _id: secondMemberId,
        phone: '0911000002',
        email: 'member2@example.com',
        role: UserRole.MEMBER,
        customerId: 'BUN-100002',
      },
    ]);
    deliveryService.deliver
      .mockResolvedValueOnce({
        status: 'sent',
        providerMessageId: 'email-1',
        recipient: 'write2get@gmail.com',
      })
      .mockResolvedValueOnce({
        status: 'sent',
        providerMessageId: 'push-1',
        recipient: firstMemberId.toString(),
      })
      .mockResolvedValueOnce({
        status: 'sent',
        providerMessageId: 'push-2',
        recipient: secondMemberId.toString(),
      });
    deliveryService.toLogStatus.mockReturnValue(NotificationLogStatus.SENT);

    const result = await service.sendCampaign(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.ADMIN,
      },
      campaign._id.toString(),
    );

    expect(deliveryService.deliver).toHaveBeenCalledTimes(3);
    expect(deliveryService.deliver).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        channel: NotificationChannel.EMAIL,
        recipient: 'write2get@gmail.com',
      }),
    );
    expect(deliveryService.deliver).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        channel: NotificationChannel.MOBILE_PUSH,
        recipient: firstMemberId.toString(),
        memberId: firstMemberId.toString(),
      }),
    );
    expect(deliveryService.deliver).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        channel: NotificationChannel.MOBILE_PUSH,
        recipient: secondMemberId.toString(),
        memberId: secondMemberId.toString(),
      }),
    );
    expect(result.deliverySummary.perRecipientResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customerId: 'BUN-100001',
          channels: expect.objectContaining({
            email: expect.objectContaining({ status: 'sent' }),
            mobile_push: expect.objectContaining({ status: 'sent' }),
          }),
        }),
        expect.objectContaining({
          customerId: 'BUN-100002',
          channels: expect.objectContaining({
            email: expect.objectContaining({ status: 'skipped' }),
            mobile_push: expect.objectContaining({ status: 'sent' }),
          }),
        }),
      ]),
    );
    expect(result.status).toBe(NotificationCampaignStatus.COMPLETED);
  });

  it('rejects non-manager campaign access', async () => {
    await expect(
      service.listCampaigns({
        sub: new Types.ObjectId().toString(),
        role: UserRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when every delivery attempt fails', async () => {
    const memberId = new Types.ObjectId();
    const campaign = {
      _id: new Types.ObjectId(),
      targetIds: [memberId],
      channels: [NotificationChannel.EMAIL],
      category: NotificationCategory.INSURANCE,
      messageSubject: 'Reminder',
      messageBody: 'Renew now',
      filters: { demoRecipientEmail: 'write2get@gmail.com' },
      status: NotificationCampaignStatus.DRAFT,
      save: jest.fn().mockResolvedValue(undefined),
    };
    campaignModel.findOne.mockResolvedValue(campaign);
    memberModel.find.mockResolvedValue([
      {
        _id: memberId,
        phone: '0911000001',
        email: 'member@example.com',
        role: UserRole.MEMBER,
      },
    ]);
    deliveryService.deliver.mockResolvedValue({
      status: 'failed',
      recipient: 'write2get@gmail.com',
      errorMessage: 'SMTP authentication failed.',
    });
    deliveryService.toLogStatus.mockReturnValue(NotificationLogStatus.FAILED);

    await expect(
      service.sendCampaign(
        {
          sub: new Types.ObjectId().toString(),
          role: UserRole.ADMIN,
        },
        campaign._id.toString(),
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
