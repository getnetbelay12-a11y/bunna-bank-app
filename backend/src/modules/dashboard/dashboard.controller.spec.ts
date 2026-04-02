import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(() => {
    service = {
      getSummary: jest.fn(),
      getBranchPerformance: jest.fn(),
      getDistrictPerformance: jest.fn(),
      getStaffRanking: jest.fn(),
      getVotingSummary: jest.fn(),
    } as unknown as jest.Mocked<DashboardService>;

    controller = new DashboardController(service);
  });

  it('delegates summary lookup', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;
    const query = { period: 'today' } as never;
    await controller.getSummary(currentUser, query);
    expect(service.getSummary).toHaveBeenCalledWith(currentUser, query);
  });

  it('delegates voting summary lookup', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;
    await controller.getVotingSummary(currentUser);
    expect(service.getVotingSummary).toHaveBeenCalledWith(currentUser);
  });
});
