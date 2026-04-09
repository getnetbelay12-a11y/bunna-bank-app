import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { LoanStatus, UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { DemoService } from './demo.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Roles(
    UserRole.MEMBER,
    UserRole.SHAREHOLDER_MEMBER,
    UserRole.SUPPORT_AGENT,
    UserRole.BRANCH_MANAGER,
    UserRole.DISTRICT_MANAGER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post('notifications/school-payment')
  triggerSchoolPaymentNotification(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: { userId?: string; profileId?: string },
  ) {
    return this.demoService.triggerSchoolPaymentNotification(currentUser, body);
  }

  @Roles(
    UserRole.MEMBER,
    UserRole.SHAREHOLDER_MEMBER,
    UserRole.SUPPORT_AGENT,
    UserRole.BRANCH_MANAGER,
    UserRole.DISTRICT_MANAGER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post('chat/create')
  createDemoChat(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body()
    body: {
      userId?: string;
      issueCategory?: string;
      initialMessage?: string;
      loanId?: string;
    },
  ) {
    return this.demoService.createDemoChat(currentUser, body);
  }

  @Roles(
    UserRole.SUPPORT_AGENT,
    UserRole.BRANCH_MANAGER,
    UserRole.DISTRICT_MANAGER,
    UserRole.HEAD_OFFICE_MANAGER,
    UserRole.ADMIN,
  )
  @Post('loan/update')
  updateDemoLoan(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: { loanId?: string; status: LoanStatus; comment?: string },
  ) {
    return this.demoService.updateDemoLoan(currentUser, body);
  }
}
