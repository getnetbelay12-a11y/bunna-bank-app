import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { LoanAction } from '../../../common/enums';

export class ProcessLoanActionDto {
  @IsEnum(LoanAction)
  action!: LoanAction;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(140, { each: true })
  deficiencyReasons?: string[];
}
