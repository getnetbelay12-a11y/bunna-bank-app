import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { ShareholdersService } from './shareholders.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shareholders')
export class ShareholdersController {
  constructor(private readonly shareholdersService: ShareholdersService) {}

  @Get('me')
  getMyShareholderProfile(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.shareholdersService.getMyShareholderProfile(currentUser);
  }

  @Get('me/voting-eligibility')
  getMyVotingEligibility(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.shareholdersService.getMyVotingEligibility(currentUser);
  }

  @Roles(
    UserRole.LOAN_OFFICER,
    UserRole.BRANCH_MANAGER,
    UserRole.DISTRICT_OFFICER,
    UserRole.DISTRICT_MANAGER,
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Get(':memberId')
  getShareholderById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.shareholdersService.getShareholderById(currentUser, memberId);
  }

  @Roles(
    UserRole.LOAN_OFFICER,
    UserRole.BRANCH_MANAGER,
    UserRole.DISTRICT_OFFICER,
    UserRole.DISTRICT_MANAGER,
    UserRole.HEAD_OFFICE_OFFICER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Get(':memberId/voting-eligibility')
  getVotingEligibilityByMemberId(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.shareholdersService.getVotingEligibilityByMemberId(
      currentUser,
      memberId,
    );
  }
}
