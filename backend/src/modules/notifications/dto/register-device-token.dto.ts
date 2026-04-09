import { IsIn, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @MaxLength(120)
  deviceId!: string;

  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';

  @IsString()
  @MaxLength(512)
  token!: string;

  @IsString()
  @MaxLength(40)
  appVersion!: string;
}
