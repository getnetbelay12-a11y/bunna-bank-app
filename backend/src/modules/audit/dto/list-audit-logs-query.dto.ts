import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class ListAuditLogsQueryDto {
  @IsOptional()
  @IsMongoId()
  actorId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsMongoId()
  entityId?: string;

  @IsOptional()
  @IsString()
  actionType?: string;
}
