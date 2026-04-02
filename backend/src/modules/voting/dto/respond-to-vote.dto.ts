import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class RespondToVoteDto {
  @IsMongoId()
  optionId!: string;

  @IsString()
  @MaxLength(1000)
  encryptedBallot!: string;

  @IsOptional()
  @IsString()
  otpCode?: string;
}
