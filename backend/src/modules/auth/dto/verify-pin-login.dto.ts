import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyPinLoginDto {
  @IsString()
  challengeId!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(12)
  pin!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceId?: string;

  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;

  @IsOptional()
  @IsBoolean()
  biometricEnabled?: boolean;
}
