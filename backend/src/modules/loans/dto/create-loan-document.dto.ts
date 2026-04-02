import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const MAX_LOAN_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_LOAN_DOCUMENTS = 10;
export const SAFE_STORAGE_KEY_PATTERN = /^[A-Za-z0-9/_ .-]+$/;
export const SAFE_MIME_TYPE_PATTERN = /^[A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+$/;

export class CreateLoanDocumentDto {
  @IsString()
  @MaxLength(64)
  documentType!: string;

  @IsString()
  @MaxLength(255)
  originalFileName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Matches(SAFE_STORAGE_KEY_PATTERN, {
    message:
      'storageKey may only contain letters, numbers, spaces, ".", "-", "_", and "/".',
  })
  storageKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(SAFE_MIME_TYPE_PATTERN, {
    message: 'mimeType must be a valid MIME type such as application/pdf.',
  })
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_LOAN_DOCUMENT_SIZE_BYTES)
  sizeBytes?: number;
}
