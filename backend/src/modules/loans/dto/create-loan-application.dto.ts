import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import {
  CreateLoanDocumentDto,
  MAX_LOAN_DOCUMENTS,
} from './create-loan-document.dto';

export class CreateLoanApplicationDto {
  @IsString()
  @MaxLength(64)
  loanType!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsNumber()
  @Min(0)
  interestRate!: number;

  @IsNumber()
  @Min(1)
  termMonths!: number;

  @IsString()
  @MaxLength(1000)
  purpose!: string;

  @IsOptional()
  @IsMongoId()
  assignedToStaffId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_LOAN_DOCUMENTS)
  @ValidateNested({ each: true })
  @Type(() => CreateLoanDocumentDto)
  documents?: CreateLoanDocumentDto[];
}
