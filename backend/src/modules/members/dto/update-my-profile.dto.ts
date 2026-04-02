import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^\+?[0-9]{9,15}$/)
  phone?: string;
}
