import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ServiceRequestStatus } from '../service-request.types';

export class UpdateServiceRequestStatusDto {
  @IsEnum(ServiceRequestStatus)
  status!: ServiceRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
