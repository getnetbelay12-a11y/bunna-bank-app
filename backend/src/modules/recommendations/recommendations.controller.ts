import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { RecommendationActionDto } from './dto';
import { RecommendationsService } from './recommendations.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Roles(UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER)
  @Get('me')
  getMyRecommendations(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.recommendationsService.getMyRecommendations(currentUser);
  }

  @Post(':recommendationId/view')
  markViewed(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('recommendationId') recommendationId: string,
  ) {
    return this.recommendationsService.markViewed(currentUser, recommendationId);
  }

  @Post(':recommendationId/dismiss')
  dismiss(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('recommendationId') recommendationId: string,
  ) {
    return this.recommendationsService.dismiss(currentUser, recommendationId);
  }

  @Post(':recommendationId/act')
  act(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('recommendationId') recommendationId: string,
    @Body() dto: RecommendationActionDto,
  ) {
    return this.recommendationsService.act(currentUser, recommendationId, dto);
  }
}
