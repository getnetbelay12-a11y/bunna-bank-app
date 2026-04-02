import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { Public, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { AuthService } from './auth.service';
import {
  CheckExistingAccountDto,
  MemberLoginDto,
  RefreshTokenDto,
  RegisterMemberDto,
  RequestOtpDto,
  StartLoginDto,
  StaffLoginDto,
  VerifyPinLoginDto,
  VerifyOtpDto,
} from './dto';
import { AuthenticatedUser } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.logout(currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentSession(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.getCurrentSession(currentUser);
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
