import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

import { UserRole } from '../../../common/enums';

export class ListStaffQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @IsMongoId()
  districtId?: string;

  @IsOptional()
  @IsString()
  isActive?: string;
}
