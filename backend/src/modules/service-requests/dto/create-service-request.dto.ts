import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ServiceRequestType } from '../service-request.types';

export class CreateServiceRequestDto {
  @IsEnum(ServiceRequestType)
  type!: ServiceRequestType;

  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
