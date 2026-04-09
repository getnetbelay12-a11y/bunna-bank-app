import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { CardRequestStatus } from '../card-management.types';

export class UpdateCardRequestStatusDto {
  @IsEnum(CardRequestStatus)
  status!: CardRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  note?: string;
}
