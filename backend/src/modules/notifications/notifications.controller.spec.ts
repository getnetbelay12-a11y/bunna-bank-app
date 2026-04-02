import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  beforeEach(() => {
    service = {
      getMyNotifications: jest.fn(),
      markAsRead: jest.fn(),
      listNotifications: jest.fn(),
      createNotification: jest.fn(),
    } as unknown as jest.Mocked<NotificationsService>;

    controller = new NotificationsController(service);
  });

  it('delegates my notifications lookup', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getMyNotifications(currentUser);

    expect(service.getMyNotifications).toHaveBeenCalledWith(currentUser);
  });

  it('delegates mark as read', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.markAsRead(currentUser, 'notif_1');

    expect(service.markAsRead).toHaveBeenCalledWith(currentUser, 'notif_1');
  });

  it('delegates list notifications', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;
    const query = { userId: 'member_1' };

    await controller.listNotifications(currentUser, query);

    expect(service.listNotifications).toHaveBeenCalledWith(query, currentUser);
  });

  it('delegates notification creation', async () => {
    const dto = { userType: 'member', userId: 'x', type: 'system', title: 't', message: 'm' } as never;

    await controller.createNotification(dto);

    expect(service.createNotification).toHaveBeenCalledWith(dto);
  });
});
