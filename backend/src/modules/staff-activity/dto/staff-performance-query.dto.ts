import { IsDateString, IsEnum, IsMongoId, IsOptional } from 'class-validator';

export enum StaffPerformancePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class StaffPerformanceQueryDto {
  @IsEnum(StaffPerformancePeriod)
  period!: StaffPerformancePeriod;

  @IsOptional()
  @IsMongoId()
  staffId?: string;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @IsMongoId()
  districtId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
