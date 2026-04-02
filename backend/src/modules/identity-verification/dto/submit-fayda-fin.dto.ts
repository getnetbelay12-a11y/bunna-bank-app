import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SubmitFaydaFinDto {
  @IsString()
  @Matches(/^\d{12}$/)
  faydaFin!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  faydaAlias?: string;
}
