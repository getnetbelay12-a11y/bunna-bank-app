import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { ActivityType } from '../../../common/enums';

export class RecordStaffActivityDto {
  @IsMongoId()
  staffId!: string;

  @IsOptional()
  @IsMongoId()
  memberId?: string;

  @IsMongoId()
  branchId!: string;

  @IsMongoId()
  districtId!: string;

  @IsEnum(ActivityType)
  activityType!: ActivityType;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsMongoId()
  referenceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  createdAt?: Date;
}
