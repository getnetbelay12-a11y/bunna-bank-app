import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('builds a manager snapshot from dashboard services', async () => {
    const dashboardService = {
      getSummary: jest.fn().mockResolvedValue({ customersServed: 1 }),
      getBranchPerformance: jest.fn().mockResolvedValue([]),
      getDistrictPerformance: jest.fn().mockResolvedValue([]),
      getStaffRanking: jest.fn().mockResolvedValue([]),
      getVotingSummary: jest.fn().mockResolvedValue([]),
    };

    const service = new ReportsService(dashboardService as never);

    const result = await service.getManagerReportSnapshot(
      { sub: 'staff_1', role: 'admin' } as never,
      { period: 'today' } as never,
    );

    expect(result.summary).toEqual({ customersServed: 1 });
    expect(dashboardService.getSummary).toHaveBeenCalled();
  });
});
