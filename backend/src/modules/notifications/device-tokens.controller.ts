import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { RegisterDeviceTokenDto } from './dto';
import { DeviceTokensService } from './device-tokens.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications/device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post('register')
  register(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.deviceTokensService.register(currentUser, dto);
  }
}
