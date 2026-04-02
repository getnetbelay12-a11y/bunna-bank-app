import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { ListAccountTransactionsQueryDto } from './dto';
import { SavingsService } from './savings.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Get('accounts/my')
  getMyAccounts(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.savingsService.getMyAccounts(currentUser);
  }

  @Get('accounts/:accountId')
  getAccountDetail(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('accountId') accountId: string,
  ) {
    return this.savingsService.getAccountDetail(currentUser, accountId);
  }

  @Get('accounts/:accountId/transactions')
  getAccountTransactions(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('accountId') accountId: string,
    @Query() query: ListAccountTransactionsQueryDto,
  ) {
    return this.savingsService.getAccountTransactions(
      currentUser,
      accountId,
      query,
    );
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
  @Get('accounts/member/:memberId')
  getMemberAccounts(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.savingsService.getMemberAccounts(currentUser, memberId);
  }
}
