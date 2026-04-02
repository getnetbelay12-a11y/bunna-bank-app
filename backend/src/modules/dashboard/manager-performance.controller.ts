import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriodQueryDto } from './dto';
import { ManagerPerformanceService } from './manager-performance.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('manager')
export class ManagerPerformanceController {
  constructor(
    private readonly managerPerformanceService: ManagerPerformanceService,
  ) {}

  @Get('head-office/performance/districts/summary')
  @Roles(UserRole.HEAD_OFFICE_MANAGER, UserRole.HEAD_OFFICE_OFFICER, UserRole.ADMIN)
  getHeadOfficeDistrictSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.managerPerformanceService.getHeadOfficeDistrictSummary(
      currentUser,
      query,
    );
  }

  @Get('head-office/performance/districts/top')
  @Roles(UserRole.HEAD_OFFICE_MANAGER, UserRole.HEAD_OFFICE_OFFICER, UserRole.ADMIN)
  getHeadOfficeTopDistricts(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.managerPerformanceService.getHeadOfficeTopDistricts(
      currentUser,
      query,
    );
  }

  @Get('head-office/performance/districts/watchlist')
  @Roles(UserRole.HEAD_OFFICE_MANAGER, UserRole.HEAD_OFFICE_OFFICER, UserRole.ADMIN)
  getHeadOfficeDistrictWatchlist(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.managerPerformanceService.getHeadOfficeDistrictWatchlist(
      currentUser,
      query,
    );
  }

  @Get('district/performance/branches/summary')
  @Roles(UserRole.DISTRICT_MANAGER, UserRole.DISTRICT_OFFICER, UserRole.ADMIN)
  getDistrictBranchSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.managerPerformanceService.getDistrictBranchSummary(currentUser, query);
  }

  @Get('district/performance/branches/top')
  @Roles(UserRole.DISTRICT_MANAGER, UserRole.DISTRICT_OFFICER, UserRole.ADMIN)
  getDistrictTopBranches(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.managerPerformanceService.getDistrictTopBranches(currentUser, query);
  }

  @Get('district/performance/branches/watchlist')
  @Roles(UserRole.DISTRICT_MANAGER, UserRole.DISTRICT_OFFICER, UserRole.ADMIN)
  getDistrictBranchWatchlist(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.managerPerformanceService.getDistrictBranchWatchlist(
      currentUser,
      query,
    );
  }

  @Get('branch/performance/employees/summary')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  getBranchEmployeeSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.managerPerformanceService.getBranchEmployeeSummary(currentUser, query);
  }

  @Get('branch/performance/employees/top')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  getBranchTopEmployees(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.managerPerformanceService.getBranchTopEmployees(currentUser, query);
  }

  @Get('branch/performance/employees/watchlist')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  getBranchEmployeeWatchlist(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.managerPerformanceService.getBranchEmployeeWatchlist(currentUser, query);
  }
}
