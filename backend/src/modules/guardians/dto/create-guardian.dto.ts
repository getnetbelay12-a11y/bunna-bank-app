import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateGuardianDto {
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  relationship!: string;

  @IsString()
  @IsIn(['linked', 'pending_verification', 'inactive'])
  status!: string;
}
