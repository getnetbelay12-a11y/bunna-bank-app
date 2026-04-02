import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import {
  CreateNotificationCampaignDto,
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
} from './dto';
import { NotificationCampaignService } from './notification-campaign.service';
import { NotificationTemplateService } from './notification-template.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.BRANCH_MANAGER,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.ADMIN,
)
@Controller('manager/notifications')
export class ManagerNotificationsController {
  constructor(
    private readonly notificationTemplateService: NotificationTemplateService,
    private readonly notificationCampaignService: NotificationCampaignService,
  ) {}

  @Get('templates')
  listTemplates() {
    return this.notificationTemplateService.listTemplates();
  }

  @Post('templates')
  createTemplate(@Body() dto: CreateNotificationTemplateDto) {
    return this.notificationTemplateService.createTemplate(dto);
  }

  @Patch('templates/:templateId')
  updateTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    return this.notificationTemplateService.updateTemplate(templateId, dto);
  }

  @Get('campaigns')
  listCampaigns(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.notificationCampaignService.listCampaigns(currentUser);
  }

  @Post('campaigns')
  createCampaign(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateNotificationCampaignDto,
  ) {
    return this.notificationCampaignService.createCampaign(currentUser, dto);
  }

  @Get('campaigns/:campaignId')
  getCampaign(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('campaignId') campaignId: string,
  ) {
    return this.notificationCampaignService.getCampaign(currentUser, campaignId);
  }

  @Post('campaigns/:campaignId/send')
  sendCampaign(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('campaignId') campaignId: string,
  ) {
    return this.notificationCampaignService.sendCampaign(currentUser, campaignId);
  }

  @Get('logs')
  listLogs(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.notificationCampaignService.listLogs(currentUser);
  }

  @Get('logs/:campaignId')
  listLogsByCampaign(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('campaignId') campaignId: string,
  ) {
    return this.notificationCampaignService.listLogs(currentUser, campaignId);
  }
}
