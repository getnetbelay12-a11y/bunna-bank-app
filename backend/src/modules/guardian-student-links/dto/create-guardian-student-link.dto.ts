import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateGuardianStudentLinkDto {
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @IsString()
  @IsNotEmpty()
  guardianId!: string;

  @IsString()
  @IsNotEmpty()
  memberCustomerId!: string;

  @IsString()
  @IsNotEmpty()
  relationship!: string;

  @IsString()
  @IsIn(['active', 'inactive', 'pending_verification'])
  status!: string;
}
