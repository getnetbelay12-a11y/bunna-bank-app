import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { LoanAction } from '../../../common/enums';

export class ProcessLoanActionDto {
  @IsEnum(LoanAction)
  action!: LoanAction;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
