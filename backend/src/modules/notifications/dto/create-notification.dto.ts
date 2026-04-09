import { IsEnum, IsIn, IsMongoId, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  UserRole,
} from '../../../common/enums';

export class CreateNotificationDto {
  @IsIn(['member', 'staff'])
  userType!: 'member' | 'staff';

  @IsMongoId()
  userId!: string;

  @IsOptional()
  @IsEnum(UserRole)
  userRole?: UserRole;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsString()
  @MaxLength(150)
  title!: string;

  @IsString()
  @MaxLength(1000)
  message!: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsMongoId()
  entityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  actionLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  priority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  deepLink?: string;

  @IsOptional()
  @IsObject()
  dataPayload?: Record<string, unknown>;
}
