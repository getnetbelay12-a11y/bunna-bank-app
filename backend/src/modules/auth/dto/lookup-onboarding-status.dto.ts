import { IsString, Matches } from 'class-validator';

export class LookupOnboardingStatusDto {
  @IsString()
  customerId!: string;

  @IsString()
  @Matches(/^(\+251|251|0)?9\d{8}$/, {
    message: 'phoneNumber must be a valid Ethiopian mobile number.',
  })
  phoneNumber!: string;
}
