import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { CardRequestType } from '../card-management.types';

export class CreateCardRequestDto {
  @IsOptional()
  @IsEnum(CardRequestType)
  requestType?: CardRequestType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  preferredBranch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cardType?: string;
}
