import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { StartFaydaVerificationDto, SubmitFaydaFinDto, UploadFaydaQrDto } from './dto';
import { IdentityVerificationService } from './identity-verification.service';

@UseGuards(JwtAuthGuard)
@Controller('identity/fayda')
export class IdentityVerificationController {
  constructor(
    private readonly identityVerificationService: IdentityVerificationService,
  ) {}

  @Post('start')
  start(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: StartFaydaVerificationDto,
  ) {
    return this.identityVerificationService.start(
      currentUser,
      dto.consentAccepted,
    );
  }

  @Post('submit-fin')
  submitFin(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: SubmitFaydaFinDto,
  ) {
    return this.identityVerificationService.submitFin(currentUser, dto);
  }

  @Post('upload-qr')
  uploadQr(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UploadFaydaQrDto,
  ) {
    return this.identityVerificationService.uploadQr(currentUser, dto);
  }

  @Post('verify')
  verify(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.identityVerificationService.verify(currentUser);
  }

  @Get('status')
  getStatus(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.identityVerificationService.getStatus(currentUser);
  }
}
