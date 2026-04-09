import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateGuardianStudentLinkDto {
  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'pending_verification'])
  status?: string;
}
