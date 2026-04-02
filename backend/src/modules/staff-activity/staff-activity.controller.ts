import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { RecordStaffActivityDto, StaffPerformanceQueryDto } from './dto';
import { StaffActivityService } from './staff-activity.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff-activity')
export class StaffActivityController {
  constructor(private readonly staffActivityService: StaffActivityService) {}

  @Roles(
    UserRole.LOAN_OFFICER,
    UserRole.BRANCH_MANAGER,
    UserRole.DISTRICT_OFFICER,
    UserRole.DISTRICT_MANAGER,
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post()
  recordActivity(@Body() dto: RecordStaffActivityDto) {
    return this.staffActivityService.recordActivity(dto);
  }

  @Roles(
    UserRole.BRANCH_MANAGER,
    UserRole.DISTRICT_OFFICER,
    UserRole.DISTRICT_MANAGER,
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Get('performance')
  getPerformance(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: StaffPerformanceQueryDto,
  ) {
    return this.staffActivityService.buildSummary(currentUser, query);
  }
}
