import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateGuardianDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  @IsIn(['linked', 'pending_verification', 'inactive'])
  status?: string;
}
