import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateVoteOptionDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;
}
