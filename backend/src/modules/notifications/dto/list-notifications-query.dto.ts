import { IsEnum, IsIn, IsMongoId, IsOptional } from 'class-validator';

import { NotificationStatus, NotificationType } from '../../../common/enums';

export class ListNotificationsQueryDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsIn(['member', 'staff'])
  userType?: 'member' | 'staff';

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
