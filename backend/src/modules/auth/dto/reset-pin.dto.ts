import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPinDto {
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

  @IsString()
  @MinLength(4)
  @MaxLength(6)
  newPin!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(6)
  confirmPin!: string;
}
