import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateInvoiceBatchDto {
  @IsString()
  @IsNotEmpty()
  schoolId!: string;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsString()
  @IsOptional()
  term?: string;

  @IsString()
  @IsOptional()
  grade?: string;
}
