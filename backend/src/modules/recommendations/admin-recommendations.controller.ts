import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { RecommendationsService } from './recommendations.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPPORT_AGENT,
  UserRole.LOAN_OFFICER,
  UserRole.BRANCH_MANAGER,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.ADMIN,
)
@Controller('admin/recommendations')
export class AdminRecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('dashboard-summary')
  getDashboardSummary(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.recommendationsService.getDashboardSummary(currentUser);
  }

  @Get('customers/:memberId')
  getCustomerRecommendations(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.recommendationsService.getCustomerRecommendationsForStaff(
      currentUser,
      memberId,
    );
  }

  @Post('generate/:memberId')
  generateForMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.recommendationsService.generateForMember(currentUser, memberId);
  }

  @Post('generate-all')
  generateForAll(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.recommendationsService.generateForAll(currentUser);
  }
}
