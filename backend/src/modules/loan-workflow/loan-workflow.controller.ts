import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { ProcessLoanActionDto } from './dto';
import { LoanWorkflowService } from './loan-workflow.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.LOAN_OFFICER,
  UserRole.BRANCH_MANAGER,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.ADMIN,
)
@Controller('loan-workflow')
export class LoanWorkflowController {
  constructor(private readonly loanWorkflowService: LoanWorkflowService) {}

  @Get('queue')
  getLoanQueue(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.loanWorkflowService.getLoanQueue(currentUser);
  }

  @Get('queue/:loanId')
  getLoanQueueDetail(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('loanId') loanId: string,
  ) {
    return this.loanWorkflowService.getLoanQueueDetail(currentUser, loanId);
  }

  @Get('queue/:loanId/customer-profile')
  getLoanCustomerProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('loanId') loanId: string,
  ) {
    return this.loanWorkflowService.getLoanCustomerProfile(currentUser, loanId);
  }

  @Patch(':loanId/action')
  processAction(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('loanId') loanId: string,
    @Body() dto: ProcessLoanActionDto,
  ) {
    return this.loanWorkflowService.processAction(currentUser, loanId, dto);
  }
}
