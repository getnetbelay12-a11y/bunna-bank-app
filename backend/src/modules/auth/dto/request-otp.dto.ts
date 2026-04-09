import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @MaxLength(32)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  purpose?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(['sms', 'email'])
  preferredOtpChannel?: 'sms' | 'email';
}
