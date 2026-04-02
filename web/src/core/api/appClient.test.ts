import { describe, expect, it, vi } from 'vitest';

import { AdminRole } from '../session';
import { FallbackDashboardApi } from './appClient';

describe('FallbackDashboardApi', () => {
  it('uses the fallback when the primary request fails', async () => {
    const api = new FallbackDashboardApi(
      {
        getSummary: vi.fn().mockRejectedValue(new Error('network')),
        getBranchPerformance: vi.fn(),
        getDistrictPerformance: vi.fn(),
        getStaffRanking: vi.fn(),
        getVotingSummary: vi.fn(),
        getHeadOfficeDistrictSummary: vi.fn(),
        getHeadOfficeTopDistricts: vi.fn(),
        getHeadOfficeDistrictWatchlist: vi.fn(),
        getDistrictBranchSummary: vi.fn(),
        getDistrictTopBranches: vi.fn(),
        getDistrictBranchWatchlist: vi.fn(),
        getBranchEmployeeSummary: vi.fn(),
        getBranchTopEmployees: vi.fn(),
        getBranchEmployeeWatchlist: vi.fn(),
      },
      {
        getSummary: vi.fn().mockResolvedValue({
          customersServed: 12,
          transactionsCount: 34,
          schoolPaymentsCount: 5,
          pendingLoansByLevel: [],
        }),
        getBranchPerformance: vi.fn(),
        getDistrictPerformance: vi.fn(),
        getStaffRanking: vi.fn(),
        getVotingSummary: vi.fn(),
        getHeadOfficeDistrictSummary: vi.fn(),
        getHeadOfficeTopDistricts: vi.fn(),
        getHeadOfficeDistrictWatchlist: vi.fn(),
        getDistrictBranchSummary: vi.fn(),
        getDistrictTopBranches: vi.fn(),
        getDistrictBranchWatchlist: vi.fn(),
        getBranchEmployeeSummary: vi.fn(),
        getBranchTopEmployees: vi.fn(),
        getBranchEmployeeWatchlist: vi.fn(),
      },
    );

    await expect(api.getSummary(AdminRole.ADMIN)).resolves.toEqual({
      customersServed: 12,
      transactionsCount: 34,
      schoolPaymentsCount: 5,
      pendingLoansByLevel: [],
    });
  });
});
