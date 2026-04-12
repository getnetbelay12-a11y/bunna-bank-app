import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import {
  ListAuditLogsQueryDto,
  ListOnboardingReviewAuditQueryDto,
} from './dto';
import { AuditService } from './audit.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.BRANCH_MANAGER,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.ADMIN,
)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditService.list(query);
  }

  @Get('onboarding-review-decisions')
  listOnboardingReviewDecisions(
    @Query() query: ListOnboardingReviewAuditQueryDto,
  ) {
    return this.auditService.listOnboardingReviewDecisions(query);
  }

  @Get('onboarding-review-decisions/export')
  async exportOnboardingReviewDecisions(
    @Query() query: ListOnboardingReviewAuditQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const csv = await this.auditService.exportOnboardingReviewDecisionsCsv(query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="onboarding-review-decisions.csv"',
    );

    return csv;
  }

  @Get(':auditId/verify')
  verifyAuditLog(@Param('auditId') auditId: string) {
    return this.auditService.verifyAuditLog(auditId);
  }

  @Get('entity/:entityType/:entityId')
  listByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.listByEntity(entityType, entityId);
  }

  @Get('actor/:actorId')
  listByActor(@Param('actorId') actorId: string) {
    return this.auditService.listByActor(actorId);
  }
}
