import { IsBoolean } from 'class-validator';

export class StartFaydaVerificationDto {
  @IsBoolean()
  consentAccepted!: boolean;
}
