import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto';
import { ServiceRequestStatus, ServiceRequestType } from '../service-request.types';

export class ListServiceRequestsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ServiceRequestType)
  type?: ServiceRequestType;

  @IsOptional()
  @IsEnum(ServiceRequestStatus)
  status?: ServiceRequestStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
