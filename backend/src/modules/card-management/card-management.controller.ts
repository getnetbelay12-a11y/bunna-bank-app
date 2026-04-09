import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { CardManagementService } from './card-management.service';
import {
  CreateCardRequestDto,
  RequestCardReplacementDto,
  UpdateCardRequestStatusDto,
} from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER)
@Controller('cards')
export class CardManagementController {
  constructor(private readonly cardManagementService: CardManagementService) {}

  @Get('my')
  fetchMyCards(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.cardManagementService.fetchMyCards(currentUser);
  }

  @Post('request')
  createRequest(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateCardRequestDto,
  ) {
    return this.cardManagementService.createRequest(currentUser, dto);
  }

  @Patch(':cardId/lock')
  lock(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('cardId') cardId: string,
  ) {
    return this.cardManagementService.lock(currentUser, cardId);
  }

  @Patch(':cardId/unlock')
  unlock(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('cardId') cardId: string,
  ) {
    return this.cardManagementService.unlock(currentUser, cardId);
  }

  @Post(':cardId/replacement')
  requestReplacement(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('cardId') cardId: string,
    @Body() dto: RequestCardReplacementDto,
  ) {
    return this.cardManagementService.requestReplacement(currentUser, cardId, dto);
  }
}

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
@Controller('manager/cards')
export class ManagerCardManagementController {
  constructor(private readonly cardManagementService: CardManagementService) {}

  @Get('requests')
  listRequests(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.cardManagementService.listManagerRequests(currentUser);
  }

  @Get('requests/:requestId')
  getRequestDetail(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('requestId') requestId: string,
  ) {
    return this.cardManagementService.getManagerRequestDetail(currentUser, requestId);
  }

  @Patch('requests/:requestId/status')
  updateRequestStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateCardRequestStatusDto,
  ) {
    return this.cardManagementService.updateRequestStatus(currentUser, requestId, dto);
  }
}
