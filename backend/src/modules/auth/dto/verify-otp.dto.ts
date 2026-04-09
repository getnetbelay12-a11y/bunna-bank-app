import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @MaxLength(32)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(8)
  otpCode!: string;
}
