import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriodQueryDto } from './dto';
import { PerformanceService } from './performance.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.BRANCH_MANAGER,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.ADMIN,
)
@Controller('manager/command-center')
export class CommandCenterController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('head-office')
  getHeadOfficeSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.performanceService.getHeadOfficeSummary(currentUser, query);
  }

  @Get('district')
  getDistrictSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.performanceService.getDistrictSummary(currentUser, query);
  }

  @Get('branch')
  getBranchSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.performanceService.getBranchSummary(currentUser, query);
  }
}
