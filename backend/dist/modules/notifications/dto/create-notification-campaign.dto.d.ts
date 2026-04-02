import { NotificationCategory, NotificationChannel, NotificationTemplateType } from '../../../common/enums';
export declare class CreateNotificationCampaignDto {
    category: NotificationCategory;
    templateType: NotificationTemplateType;
    channels: NotificationChannel[];
    targetType: 'single_customer' | 'selected_customers' | 'filtered_customers';
    targetIds?: string[];
    filters?: Record<string, unknown>;
    messageSubject?: string;
    messageBody?: string;
    demoRecipientEmail?: string;
    scheduledAt?: string;
}
