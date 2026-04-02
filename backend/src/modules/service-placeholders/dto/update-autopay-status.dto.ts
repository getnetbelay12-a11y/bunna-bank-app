import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAutopayStatusDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsBoolean()
  enabled!: boolean;
}
