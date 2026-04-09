import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTelegramPreferencesDto {
  @IsOptional()
  @IsBoolean()
  telegramSubscribed?: boolean;

  @IsOptional()
  @IsBoolean()
  optInLoanReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  optInInsuranceReminders?: boolean;
}
