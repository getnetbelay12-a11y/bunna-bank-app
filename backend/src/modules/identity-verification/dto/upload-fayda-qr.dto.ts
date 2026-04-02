import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadFaydaQrDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  qrDataRaw?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  faydaAlias?: string;
}
