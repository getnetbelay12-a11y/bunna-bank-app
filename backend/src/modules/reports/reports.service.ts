import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriodQueryDto } from '../dashboard/dto';
import { DashboardService } from '../dashboard/dashboard.service';

@Injectable()
export class ReportsService {
  constructor(private readonly dashboardService: DashboardService) {}

  async getManagerReportSnapshot(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ) {
    const [summary, branchPerformance, districtPerformance, staffRanking, votingSummary] =
      await Promise.all([
        this.dashboardService.getSummary(currentUser, query),
        this.dashboardService.getBranchPerformance(currentUser, query),
        this.dashboardService.getDistrictPerformance(currentUser, query),
        this.dashboardService.getStaffRanking(currentUser, query),
        this.dashboardService.getVotingSummary(currentUser),
      ]);

    return {
      generatedAt: new Date(),
      summary,
      branchPerformance,
      districtPerformance,
      staffRanking,
      votingSummary,
    };
  }
}
