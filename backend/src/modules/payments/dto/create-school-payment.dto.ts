import {
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSchoolPaymentDto {
  @IsMongoId()
  accountId!: string;

  @IsString()
  studentId!: string;

  @IsString()
  schoolName!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsIn(['mobile', 'branch'])
  channel!: 'mobile' | 'branch';

  @IsOptional()
  @IsString()
  narration?: string;
}
