import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { CreateServiceRequestDto, ListServiceRequestsQueryDto } from './dto';
import { ServiceRequestsService } from './service-requests.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER)
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateServiceRequestDto,
  ) {
    return this.serviceRequestsService.create(currentUser, dto);
  }

  @Get('my')
  listMyRequests(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListServiceRequestsQueryDto,
  ) {
    return this.serviceRequestsService.listMyRequests(currentUser, query);
  }

  @Get(':requestId')
  getForActor(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('requestId') requestId: string,
  ) {
    return this.serviceRequestsService.getForActor(currentUser, requestId);
  }

  @Patch(':requestId/cancel')
  cancel(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('requestId') requestId: string,
  ) {
    return this.serviceRequestsService.cancel(currentUser, requestId);
  }
}
