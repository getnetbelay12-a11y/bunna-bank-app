import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateTelegramLinkCodeDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  expiresInMinutes?: number;
}
