import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { ListAuditLogsQueryDto } from './dto';
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
