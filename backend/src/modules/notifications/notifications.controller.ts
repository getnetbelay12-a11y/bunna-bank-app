import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { CreateNotificationDto, ListNotificationsQueryDto } from './dto';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  getMyNotifications(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.notificationsService.getMyNotifications(currentUser);
  }

  @Patch(':notificationId/read')
  markAsRead(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(currentUser, notificationId);
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
  @Get()
  listNotifications(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationsService.listNotifications(query, currentUser);
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
  @Post()
  createNotification(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(dto);
  }
}
