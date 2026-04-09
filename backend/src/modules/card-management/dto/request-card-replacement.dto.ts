import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestCardReplacementDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reason?: string;
}
