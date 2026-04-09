import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckExistingAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  faydaFin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsObject()
  nationalIdData?: Record<string, unknown>;
}
