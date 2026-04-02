import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateAtmCardRequestDto } from './dto/create-atm-card-request.dto';
import { CreateAutopayDto } from './dto/create-autopay.dto';
import { SelfieVerifyDto } from './dto/selfie-verify.dto';
import { UpdateAccountLockDto } from './dto/update-account-lock.dto';
import { UpdateAutopayStatusDto } from './dto/update-autopay-status.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { ServicePlaceholdersService } from './service-placeholders.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER)
@Controller()
export class ServicePlaceholdersController {
  constructor(
    private readonly servicePlaceholdersService: ServicePlaceholdersService,
  ) {}

  @Post('autopay/create')
  createAutopay(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateAutopayDto,
  ) {
    return this.servicePlaceholdersService.createAutopay(currentUser, dto);
  }

  @Get('autopay/list')
  listAutopay(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.servicePlaceholdersService.listAutopay(currentUser);
  }

  @Patch('autopay/status')
  updateAutopayStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateAutopayStatusDto,
  ) {
    return this.servicePlaceholdersService.updateAutopayStatus(currentUser, dto);
  }

  @Patch('security/account-lock')
  updateAccountLock(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateAccountLockDto,
  ) {
    return this.servicePlaceholdersService.updateAccountLock(currentUser, dto);
  }

  @Get('security/account-lock')
  getAccountLock(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.servicePlaceholdersService.getAccountLock(currentUser);
  }

  @Post('atm-card/request')
  createAtmCardRequest(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateAtmCardRequestDto,
  ) {
    return this.servicePlaceholdersService.createAtmCardRequest(currentUser, dto);
  }

  @Post('profile/update-phone')
  updatePhone(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdatePhoneDto,
  ) {
    return this.servicePlaceholdersService.updatePhone(currentUser, dto);
  }

  @Post('account/add-member')
  addMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: AddMemberDto,
  ) {
    return this.servicePlaceholdersService.addMember(currentUser, dto);
  }

  @Post('kyc/selfie-verify')
  selfieVerify(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: SelfieVerifyDto,
  ) {
    return this.servicePlaceholdersService.selfieVerify(currentUser, dto);
  }
}
