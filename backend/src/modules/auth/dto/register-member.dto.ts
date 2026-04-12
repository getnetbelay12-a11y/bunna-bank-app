import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { FaydaExtractionDto } from './fayda-extraction.dto';

export class RegisterMemberDto {
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsString()
  @MaxLength(32)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

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
  preferredBranchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  preferredBranchName?: string;

  @IsString()
  @MinLength(4)
  password!: string;

  @IsString()
  @MinLength(4)
  confirmPassword!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  faydaFin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  faydaAlias?: string;

  @IsOptional()
  @IsString()
  faydaQrData?: string;

  @IsOptional()
  @IsString()
  faydaFrontImage?: string;

  @IsOptional()
  @IsString()
  faydaBackImage?: string;

  @IsOptional()
  @IsBoolean()
  consentAccepted?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => FaydaExtractionDto)
  extractedFaydaData?: FaydaExtractionDto;
}
