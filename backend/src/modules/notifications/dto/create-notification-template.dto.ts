import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  NotificationCategory,
  NotificationChannel,
  NotificationTemplateType,
} from '../../../common/enums';

export class CreateNotificationTemplateDto {
  @IsEnum(NotificationCategory)
  category!: NotificationCategory;

  @IsEnum(NotificationTemplateType)
  templateType!: NotificationTemplateType;

  @IsString()
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @MaxLength(2000)
  messageBody!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(NotificationChannel, { each: true })
  channelDefaults!: NotificationChannel[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
