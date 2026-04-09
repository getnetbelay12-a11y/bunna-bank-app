import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateLoanDocumentDto } from './create-loan-document.dto';

export class CreateLoanApplicationDto {
  @IsString()
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
  purpose!: string;

  @IsOptional()
  @IsMongoId()
  assignedToStaffId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLoanDocumentDto)
  documents?: CreateLoanDocumentDto[];
}
