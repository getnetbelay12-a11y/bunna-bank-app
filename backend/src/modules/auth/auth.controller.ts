import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import { Public, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { AuthSecurityService } from './auth-security.service';
import { AuthService } from './auth.service';
import {
  CheckExistingAccountDto,
  LookupOnboardingStatusDto,
  MemberLoginDto,
  RefreshTokenDto,
  RecoveryOptionsDto,
  RegisterMemberDto,
  RequestOtpDto,
  ResetPinDto,
  StartLoginDto,
  StaffLoginDto,
  VerifyStaffStepUpDto,
  VerifyPinLoginDto,
  VerifyOtpDto,
} from './dto';
import { AuthenticatedUser } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authSecurityService: AuthSecurityService,
  ) {}

  @Public()
  @Post('check-existing-account')
  checkExistingAccount(@Body() dto: CheckExistingAccountDto) {
    return this.authService.checkExistingAccount(dto);
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterMemberDto) {
    return this.authService.registerMember(dto);
  }

  @Public()
  @Post('start-login')
  startLogin(@Body() dto: StartLoginDto) {
    return this.authService.startLogin(dto);
  }

  @Public()
  @Post('verify-pin')
  verifyPinLogin(@Body() dto: VerifyPinLoginDto) {
    return this.authService.verifyPinLogin(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: MemberLoginDto) {
    return this.authService.loginMember(dto);
  }

  @Public()
  @Post('member/login')
  loginMember(@Body() dto: MemberLoginDto) {
    return this.authService.loginMember(dto);
  }

  @Public()
  @Post('staff/login')
  loginStaff(@Body() dto: StaffLoginDto) {
    return this.authService.loginStaff(dto);
  }

  @Public()
  @Post('request-otp')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Public()
  @Post('recovery-options')
  getRecoveryOptions(@Body() dto: RecoveryOptionsDto) {
    return this.authService.getRecoveryOptions(dto);
  }

  @Public()
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('onboarding-status')
  getOnboardingStatus(@Body() dto: LookupOnboardingStatusDto) {
    return this.authService.getOnboardingStatus(dto);
  }

  @Public()
  @Post('reset-pin')
  resetPin(@Body() dto: ResetPinDto) {
    return this.authService.resetPin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.logout(currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Post('staff/verify-step-up')
  verifyStaffStepUp(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: VerifyStaffStepUpDto,
  ) {
    return this.authService.verifyStaffStepUp(currentUser, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentSession(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.getCurrentSession(currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get('security-overview')
  getSecurityOverview(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authSecurityService.getSecurityOverview(currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:challengeId')
  revokeSession(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('challengeId') challengeId: string,
  ) {
    return this.authSecurityService.revokeSession(currentUser, challengeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refreshTokens(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refreshTokens(currentUser, dto);
  }
}
