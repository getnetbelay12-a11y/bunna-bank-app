import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @MaxLength(32)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  purpose?: string;
}
