import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { ListServiceRequestsQueryDto, UpdateServiceRequestStatusDto } from './dto';
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

  @Get(':requestId')
  get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('requestId') requestId: string,
  ) {
    return this.serviceRequestsService.getForActor(currentUser, requestId);
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
