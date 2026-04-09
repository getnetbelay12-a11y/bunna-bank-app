import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOnboardingReviewDto {
  @IsIn(['submitted', 'review_in_progress', 'needs_action', 'approved'])
  status!: 'submitted' | 'review_in_progress' | 'needs_action' | 'approved';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
