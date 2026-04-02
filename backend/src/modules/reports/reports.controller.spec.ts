import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  it('delegates snapshot lookup', async () => {
    const service = {
      getManagerReportSnapshot: jest.fn(),
    };
    const controller = new ReportsController(service as never);
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;
    const query = { period: 'today' } as never;

    await controller.getManagerSnapshot(currentUser, query);

    expect(service.getManagerReportSnapshot).toHaveBeenCalledWith(currentUser, query);
  });
});
