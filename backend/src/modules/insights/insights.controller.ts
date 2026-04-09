import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { InsightsService } from './insights.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('me')
  getMyInsights(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.insightsService.getMyInsights(currentUser);
  }

  @Get('me/home')
  getMyHomeInsights(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.insightsService.getMyHomeInsights(currentUser);
  }
}
