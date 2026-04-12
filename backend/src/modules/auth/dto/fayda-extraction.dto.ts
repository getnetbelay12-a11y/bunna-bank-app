import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class FaydaExtractionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  sex?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nationality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  woreda?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  faydaFin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  cardNumber?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dateOfBirthCandidates?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expiryDateCandidates?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reviewRequiredFields?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  extractionMethod?: string;
}
