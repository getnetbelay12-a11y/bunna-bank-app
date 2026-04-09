import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FeePlanItemDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsNumber()
  amount!: number;
}

export class CreateFeePlanDto {
  @IsString()
  @IsNotEmpty()
  schoolId!: string;

  @IsString()
  @IsNotEmpty()
  schoolName!: string;

  @IsString()
  @IsNotEmpty()
  academicYear!: string;

  @IsString()
  @IsNotEmpty()
  term!: string;

  @IsString()
  @IsNotEmpty()
  grade!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FeePlanItemDto)
  items!: FeePlanItemDto[];
}
