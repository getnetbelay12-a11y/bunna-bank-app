import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class StaffLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
