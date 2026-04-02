import { IsEnum, IsIn, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

import { NotificationStatus, NotificationType, UserRole } from '../../../common/enums';

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
}
