import { IsBoolean, IsOptional } from 'class-validator';

export class RecommendationActionDto {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
