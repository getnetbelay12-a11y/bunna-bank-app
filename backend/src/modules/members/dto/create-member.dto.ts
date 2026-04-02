import { IsEmail, IsEnum, IsMongoId, IsOptional, IsPhoneNumber, IsString, Min, MinLength } from 'class-validator';

import { MemberType, UserRole } from '../../../common/enums';

export class CreateMemberDto {
  @IsString()
  @MinLength(3)
  memberNumber!: string;

  @IsEnum(MemberType)
  memberType!: MemberType;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @MinLength(3)
  fullName!: string;

  @IsPhoneNumber('ET')
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsMongoId()
  branchId!: string;

  @IsMongoId()
  districtId!: string;

  @Min(0)
  shareBalance!: number;

  @IsString()
  @MinLength(6)
  password!: string;
}
