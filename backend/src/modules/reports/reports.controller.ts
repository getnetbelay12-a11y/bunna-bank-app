import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriodQueryDto } from '../dashboard/dto';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.BRANCH_MANAGER,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.ADMIN,
)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('manager-snapshot')
  getManagerSnapshot(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.reportsService.getManagerReportSnapshot(currentUser, query);
  }
}
