import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { ListStaffQueryDto } from './dto';
import { StaffService } from './staff.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.LOAN_OFFICER,
  UserRole.BRANCH_MANAGER,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.ADMIN,
)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('me')
  getMyProfile(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.staffService.getMyProfile(currentUser);
  }

  @Get()
  listStaff(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListStaffQueryDto,
  ) {
    return this.staffService.listStaff(currentUser, query);
  }

  @Get('branch/:branchId')
  getBranchStaff(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('branchId') branchId: string,
  ) {
    return this.staffService.getBranchStaff(currentUser, branchId);
  }

  @Get('district/:districtId')
  getDistrictStaff(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('districtId') districtId: string,
  ) {
    return this.staffService.getDistrictStaff(currentUser, districtId);
  }

  @Get(':staffId')
  getStaffById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('staffId') staffId: string,
  ) {
    return this.staffService.getStaffById(currentUser, staffId);
  }
}
