import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLoanDocumentDto {
  @IsString()
  documentType!: string;

  @IsString()
  originalFileName!: string;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;
}
