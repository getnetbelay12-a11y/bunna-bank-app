import { IsDateString, IsMongoId, IsOptional, IsString } from 'class-validator';

export class ListOnboardingReviewAuditQueryDto {
  @IsOptional()
  @IsMongoId()
  actorId?: string;

  @IsOptional()
  @IsMongoId()
  memberId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  approvalReasonCode?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  currentOnly?: string;
}
