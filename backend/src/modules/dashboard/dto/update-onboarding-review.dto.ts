import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOnboardingReviewDto {
  @IsIn(['submitted', 'review_in_progress', 'needs_action', 'approved'])
  status!: 'submitted' | 'review_in_progress' | 'needs_action' | 'approved';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  approvalReasonCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  supersessionReasonCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  stepUpToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  approvalJustification?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acknowledgedMismatchFields?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acknowledgedSupersessionFields?: string[];
}
