import { Type } from 'class-transformer';
import { IsDateString, IsMongoId, IsOptional } from 'class-validator';

export class SchoolPaymentSummaryQueryDto {
  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
