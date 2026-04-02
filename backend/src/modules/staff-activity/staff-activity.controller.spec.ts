import { StaffActivityController } from './staff-activity.controller';
import { StaffActivityService } from './staff-activity.service';

describe('StaffActivityController', () => {
  let controller: StaffActivityController;
  let service: jest.Mocked<StaffActivityService>;

  beforeEach(() => {
    service = {
      recordActivity: jest.fn(),
      buildSummary: jest.fn(),
    } as unknown as jest.Mocked<StaffActivityService>;

    controller = new StaffActivityController(service);
  });

  it('delegates recordActivity', async () => {
    const dto = { staffId: 'x', branchId: 'b', districtId: 'd', activityType: 'loan_reviewed' } as never;

    await controller.recordActivity(dto);

    expect(service.recordActivity).toHaveBeenCalledWith(dto);
  });

  it('delegates performance lookup', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;
    const query = { period: 'monthly' } as never;

    await controller.getPerformance(currentUser, query);

    expect(service.buildSummary).toHaveBeenCalledWith(currentUser, query);
  });
});
