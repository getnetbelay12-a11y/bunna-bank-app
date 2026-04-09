import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class RecoveryOptionsDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phoneNumber?: string;

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
  @MaxLength(120)
  identifier?: string;
}
