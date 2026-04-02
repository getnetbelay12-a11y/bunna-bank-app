import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StartLoginDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceId?: string;
}
