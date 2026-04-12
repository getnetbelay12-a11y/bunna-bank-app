import { IsEnum, IsMongoId, IsObject, IsOptional, IsString } from 'class-validator';

import { UserRole } from '../../../common/enums';

export class CreateAuditLogDto {
  @IsMongoId()
  actorId!: string;

  @IsEnum(UserRole)
  actorRole!: UserRole;

  @IsString()
  actionType!: string;

  @IsString()
  entityType!: string;

  @IsMongoId()
  entityId!: string;

  @IsOptional()
  @IsObject()
  before?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  after?: Record<string, unknown> | null;

  @IsOptional()
  decisionVersion?: number;

  @IsOptional()
  isCurrentDecision?: boolean;

  @IsOptional()
  @IsMongoId()
  supersedesAuditId?: string;

  @IsOptional()
  @IsMongoId()
  supersededByAuditId?: string;
}
