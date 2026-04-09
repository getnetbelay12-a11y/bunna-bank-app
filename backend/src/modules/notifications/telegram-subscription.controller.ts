import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, Public, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import {
  CreateTelegramLinkCodeDto,
  UpdateTelegramPreferencesDto,
} from './dto';
import { TelegramSubscriptionService } from './telegram-subscription.service';

@Controller('notifications/telegram')
export class TelegramSubscriptionController {
  constructor(
    private readonly telegramSubscriptionService: TelegramSubscriptionService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER)
  @Get('me')
  getMySubscription(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.telegramSubscriptionService.getMySubscription(currentUser);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER)
  @Post('link-code')
  createLinkCode(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateTelegramLinkCodeDto,
  ) {
    return this.telegramSubscriptionService.createLinkCode(
      currentUser,
      dto.expiresInMinutes,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER)
  @Post('preferences')
  updatePreferences(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateTelegramPreferencesDto,
  ) {
    return this.telegramSubscriptionService.updateMyPreferences(currentUser, dto);
  }

  @Public()
  @Post('webhook')
  handleWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('x-telegram-bot-api-secret-token') secretHeader?: string,
  ) {
    return this.telegramSubscriptionService.handleWebhook(
      payload as never,
      undefined,
      secretHeader,
    );
  }

  @Public()
  @Post('webhook/:secret')
  handleWebhookWithSecret(
    @Param('secret') secret: string,
    @Body() payload: Record<string, unknown>,
    @Headers('x-telegram-bot-api-secret-token') secretHeader?: string,
  ) {
    return this.telegramSubscriptionService.handleWebhook(
      payload as never,
      secret,
      secretHeader,
    );
  }
}
