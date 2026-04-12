import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import {
  DashboardPeriodQueryDto,
  UpdateAutopayOperationDto,
  UpdateOnboardingReviewDto,
} from './dto';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.BRANCH_MANAGER,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.ADMIN,
)
@Controller('manager/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.dashboardService.getSummary(currentUser, query);
  }

  @Get('branch-performance')
  getBranchPerformance(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.dashboardService.getBranchPerformance(currentUser, query);
  }

  @Get('district-performance')
  getDistrictPerformance(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.dashboardService.getDistrictPerformance(currentUser, query);
  }

  @Get('staff-ranking')
  getStaffRanking(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DashboardPeriodQueryDto,
  ) {
    return this.dashboardService.getStaffRanking(currentUser, query);
  }

  @Get('voting-summary')
  getVotingSummary(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.dashboardService.getVotingSummary(currentUser);
  }

  @Get('onboarding-review')
  getOnboardingReviewQueue(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.dashboardService.getOnboardingReviewQueue(currentUser);
  }

  @Get('onboarding-review/:memberId/evidence')
  getOnboardingEvidenceDetail(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.dashboardService.getOnboardingEvidenceDetail(currentUser, memberId);
  }

  @Get('autopay-operations')
  getAutopayOperations(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.dashboardService.getAutopayOperations(currentUser);
  }

  @Patch('autopay-operations/:id')
  updateAutopayOperation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAutopayOperationDto,
  ) {
    return this.dashboardService.updateAutopayOperation(currentUser, id, dto);
  }

  @Patch('onboarding-review/:memberId')
  updateOnboardingReview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateOnboardingReviewDto,
  ) {
    return this.dashboardService.updateOnboardingReview(currentUser, memberId, dto);
  }
}
