import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAutopayOperationDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
