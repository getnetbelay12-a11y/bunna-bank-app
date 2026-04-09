import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import {
  CreateQrPaymentDto,
  CreateSchoolPaymentDto,
  SchoolPaymentSummaryQueryDto,
} from './dto';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('school')
  createSchoolPayment(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateSchoolPaymentDto,
  ) {
    return this.paymentsService.createSchoolPayment(currentUser, dto);
  }

  @Post('qr/scan-pay')
  createQrPayment(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateQrPaymentDto,
  ) {
    return this.paymentsService.createQrPayment(currentUser, dto);
  }

  @Get('school/my')
  getMySchoolPayments(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.paymentsService.getMySchoolPayments(currentUser);
  }

  @Get('receipts/my')
  getMyPaymentReceipts(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.paymentsService.getMyPaymentReceipts(currentUser);
  }

  @Get('activity/my')
  getMyPaymentActivity(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.paymentsService.getMyPaymentActivity(currentUser);
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
  @Get('receipts/member/:memberId')
  getManagerPaymentReceipts(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.paymentsService.getManagerPaymentReceipts(currentUser, memberId);
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
  @Get('activity')
  getManagerPaymentActivity(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.paymentsService.getManagerPaymentActivity(currentUser);
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
  @Get('school/summary')
  getSchoolPaymentSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: SchoolPaymentSummaryQueryDto,
  ) {
    return this.paymentsService.getSchoolPaymentSummary(currentUser, query);
  }
}
