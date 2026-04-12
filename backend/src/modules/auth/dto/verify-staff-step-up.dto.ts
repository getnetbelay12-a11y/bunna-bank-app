import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyStaffStepUpDto {
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  password!: string;

  @IsMongoId()
  memberId!: string;
}
