import { IsString } from 'class-validator';

export class AddMemberDto {
  @IsString()
  memberName!: string;

  @IsString()
  relationship!: string;

  @IsString()
  phoneNumber!: string;

  @IsString()
  faydaDocument!: string;

  @IsString()
  selfieImage!: string;
}

