import { IsDateString, IsString, MaxLength } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @MaxLength(150)
  title!: string;

  @IsString()
  @MaxLength(1000)
  description!: string;

  @IsString()
  @MaxLength(50)
  type!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
