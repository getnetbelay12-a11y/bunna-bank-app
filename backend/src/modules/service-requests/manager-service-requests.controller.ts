import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import {
  AcknowledgeServiceRequestBreachDto,
  AssignServiceRequestDto,
  CreateManagerSecurityReviewDto,
  EscalateStalledServiceRequestDto,
  ListServiceRequestsQueryDto,
  ReportSecurityReviewMetricsContractIssueDto,
  UpdateServiceRequestStatusDto,
} from './dto';
import { ServiceRequestsService } from './service-requests.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPPORT_AGENT,
  UserRole.BRANCH_MANAGER,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.ADMIN,
)
@Controller('manager/service-requests')
export class ManagerServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Get()
  list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListServiceRequestsQueryDto,
  ) {
    return this.serviceRequestsService.listManagerRequests(currentUser, query);
  }

  @Get('security-review/metrics')
  @Roles(UserRole.HEAD_OFFICE_OFFICER, UserRole.HEAD_OFFICE_MANAGER, UserRole.ADMIN)
  getSecurityReviewMetrics(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.serviceRequestsService.getSecurityReviewMetrics(currentUser);
  }

  @Post('security-review/metrics/report-contract-issue')
  @Roles(UserRole.HEAD_OFFICE_OFFICER, UserRole.HEAD_OFFICE_MANAGER, UserRole.ADMIN)
  reportSecurityReviewMetricsContractIssue(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: ReportSecurityReviewMetricsContractIssueDto,
  ) {
    return this.serviceRequestsService.reportSecurityReviewMetricsContractIssue(
      currentUser,
      dto,
    );
  }

  @Post('security-review')
  @Roles(UserRole.HEAD_OFFICE_OFFICER, UserRole.HEAD_OFFICE_MANAGER, UserRole.ADMIN)
  createSecurityReview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateManagerSecurityReviewDto,
  ) {
    return this.serviceRequestsService.createManagerSecurityReview(currentUser, dto);
  }

  @Get(':requestId')
  get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('requestId') requestId: string,
  ) {
    return this.serviceRequestsService.getForActor(currentUser, requestId);
  }

  @Patch(':requestId/assign')
  @Roles(UserRole.HEAD_OFFICE_OFFICER, UserRole.HEAD_OFFICE_MANAGER, UserRole.ADMIN)
  assignToCurrentReviewer(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('requestId') requestId: string,
    @Body() _dto: AssignServiceRequestDto,
  ) {
    return this.serviceRequestsService.assignToCurrentReviewer(currentUser, requestId);
  }

  @Patch(':requestId/acknowledge-breach')
  @Roles(UserRole.HEAD_OFFICE_OFFICER, UserRole.HEAD_OFFICE_MANAGER, UserRole.ADMIN)
  acknowledgeBreach(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('requestId') requestId: string,
    @Body() _dto: AcknowledgeServiceRequestBreachDto,
  ) {
    return this.serviceRequestsService.acknowledgeSecurityReviewBreach(currentUser, requestId);
  }

  @Patch(':requestId/escalate-stalled')
  @Roles(UserRole.HEAD_OFFICE_MANAGER, UserRole.ADMIN)
  escalateStalled(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('requestId') requestId: string,
    @Body() _dto: EscalateStalledServiceRequestDto,
  ) {
    return this.serviceRequestsService.escalateStalledSecurityReview(currentUser, requestId);
  }

  @Patch(':requestId/status')
  updateStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateServiceRequestStatusDto,
  ) {
    return this.serviceRequestsService.updateStatus(currentUser, requestId, dto);
  }
}
