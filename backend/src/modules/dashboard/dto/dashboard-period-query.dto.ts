import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum DashboardPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class DashboardPeriodQueryDto {
  @IsOptional()
  @IsEnum(DashboardPeriod)
  period?: DashboardPeriod = DashboardPeriod.TODAY;

  @IsOptional()
  @IsDateString()
  date?: string;
}
