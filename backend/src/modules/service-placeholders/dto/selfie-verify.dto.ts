import { IsString } from 'class-validator';

export class SelfieVerifyDto {
  @IsString()
  imageReference!: string;

  @IsString()
  purpose!: string;
}

