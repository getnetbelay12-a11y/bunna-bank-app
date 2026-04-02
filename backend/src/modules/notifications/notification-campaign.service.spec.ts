import { ForbiddenException, NotFoundException } from '@nestjs/common';
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

    service = new NotificationCampaignService(
      campaignModel as never,
      logModel as never,
      memberModel as never,
      templateService as never,
      deliveryService as never,
      templateRendererService as never,
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
        _id: { $in: [expect.any(Types.ObjectId)] },
      }),
    );
    expect(campaignModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationCampaignStatus.DRAFT,
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

  it('forces the configured test email recipient when email is selected', async () => {
    const previousRecipient = process.env.TEST_EMAIL_RECIPIENT;
    process.env.TEST_EMAIL_RECIPIENT = 'write2get@gmail.com';
    service = new NotificationCampaignService(
      campaignModel as never,
      logModel as never,
      memberModel as never,
      templateService as never,
      deliveryService as never,
      templateRendererService as never,
    );

    try {
      const memberId = new Types.ObjectId();
      memberModel.find.mockResolvedValue([
        {
          _id: memberId,
          phone: '0911000001',
          email: 'member@example.com',
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
          channels: [NotificationChannel.EMAIL],
          targetType: 'selected_customers',
          targetIds: [memberId.toString()],
        },
      );

      expect(campaignModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            demoRecipientEmail: 'write2get@gmail.com',
          }),
        }),
      );
    } finally {
      if (previousRecipient === undefined) {
        delete process.env.TEST_EMAIL_RECIPIENT;
      } else {
        process.env.TEST_EMAIL_RECIPIENT = previousRecipient;
      }
    }
  });

  it('rejects non-manager campaign access', async () => {
    await expect(
      service.listCampaigns({
        sub: new Types.ObjectId().toString(),
        role: UserRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
