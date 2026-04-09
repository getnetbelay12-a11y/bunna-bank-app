import { ManagerNotificationsController } from './manager-notifications.controller';
import { NotificationCampaignService } from './notification-campaign.service';
import { NotificationTemplateService } from './notification-template.service';

describe('ManagerNotificationsController', () => {
  let controller: ManagerNotificationsController;
  let notificationTemplateService: jest.Mocked<NotificationTemplateService>;
  let notificationCampaignService: jest.Mocked<NotificationCampaignService>;

  beforeEach(() => {
    notificationTemplateService = {
      listTemplates: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
    } as unknown as jest.Mocked<NotificationTemplateService>;

    notificationCampaignService = {
      listCampaigns: jest.fn(),
      createCampaign: jest.fn(),
      getCampaign: jest.fn(),
      sendCampaign: jest.fn(),
      listLogs: jest.fn(),
    } as unknown as jest.Mocked<NotificationCampaignService>;

    controller = new ManagerNotificationsController(
      notificationTemplateService,
      notificationCampaignService,
    );
  });

  it('delegates campaign send requests to the campaign service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.sendCampaign(currentUser, 'campaign_1');

    expect(notificationCampaignService.sendCampaign).toHaveBeenCalledWith(
      currentUser,
      'campaign_1',
    );
  });

  it('delegates campaign creation requests to the campaign service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;
    const dto = { category: 'loan', templateType: 'loan_due_soon' } as never;

    await controller.createCampaign(currentUser, dto);

    expect(notificationCampaignService.createCampaign).toHaveBeenCalledWith(
      currentUser,
      dto,
    );
  });

  it('delegates template listing to the template service', async () => {
    await controller.listTemplates();

    expect(notificationTemplateService.listTemplates).toHaveBeenCalled();
  });
});
