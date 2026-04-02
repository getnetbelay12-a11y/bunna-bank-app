import { IsString } from 'class-validator';

export class UpdatePhoneDto {
  @IsString()
  phoneNumber!: string;

  @IsString()
  faydaFrontImage!: string;

  @IsString()
  faydaBackImage!: string;

  @IsString()
  selfieImage!: string;
}

