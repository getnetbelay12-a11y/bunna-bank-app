import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1500)
  message!: string;
}
