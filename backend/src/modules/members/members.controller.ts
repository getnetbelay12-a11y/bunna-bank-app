import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { CreateMemberDto, ListMembersQueryDto, UpdateMyProfileDto } from './dto';
import { MembersService } from './members.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('me')
  getMyProfile(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.membersService.getMyProfile(currentUser);
  }

  @Patch('me')
  updateMyProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.membersService.updateMyProfile(currentUser, dto);
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
  @Get(':memberId')
  getMemberById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.getMemberById(currentUser, memberId);
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
  createMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateMemberDto,
  ) {
    return this.membersService.createMember(currentUser, dto);
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
  listMembers(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListMembersQueryDto,
  ) {
    return this.membersService.listMembers(currentUser, query);
  }
}
