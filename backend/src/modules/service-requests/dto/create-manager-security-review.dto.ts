import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateManagerSecurityReviewDto {
  @IsString()
  memberId!: string;

  @IsString()
  @MaxLength(120)
  memberLabel!: string;

  @IsString()
  @MaxLength(120)
  reviewerLabel!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  failureCount!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  escalationThreshold!: number;

  @IsString()
  latestFailureAt!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reasonCodes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  auditIds?: string[];
}
