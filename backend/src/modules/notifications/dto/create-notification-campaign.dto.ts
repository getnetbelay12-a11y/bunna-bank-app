import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import {
  NotificationCategory,
  NotificationChannel,
  NotificationTemplateType,
} from '../../../common/enums';

export class CreateNotificationCampaignDto {
  @IsEnum(NotificationCategory)
  category!: NotificationCategory;

  @IsEnum(NotificationTemplateType)
  templateType!: NotificationTemplateType;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(NotificationChannel, { each: true })
  channels!: NotificationChannel[];

  @IsIn(['single_customer', 'selected_customers', 'filtered_customers'])
  targetType!: 'single_customer' | 'selected_customers' | 'filtered_customers';

  @ValidateIf((value: CreateNotificationCampaignDto) =>
    ['single_customer', 'selected_customers'].includes(value.targetType),
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  targetIds?: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  messageSubject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  messageBody?: string;

  @IsOptional()
  @IsEmail()
  demoRecipientEmail?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
