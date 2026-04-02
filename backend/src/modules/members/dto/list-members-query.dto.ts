import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto';
import { MemberType, UserRole } from '../../../common/enums';

export class ListMembersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(MemberType)
  memberType?: MemberType;

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
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
