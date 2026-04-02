import { IsString } from 'class-validator';

export class CreateAtmCardRequestDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phoneNumber!: string;

  @IsString()
  region!: string;

  @IsString()
  city!: string;

  @IsString()
  preferredBranch!: string;

  @IsString()
  faydaFrontImage!: string;

  @IsString()
  faydaBackImage!: string;

  @IsString()
  selfieImage!: string;

  @IsString()
  pin!: string;
}
