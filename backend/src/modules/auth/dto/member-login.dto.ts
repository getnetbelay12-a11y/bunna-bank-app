import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MemberLoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
