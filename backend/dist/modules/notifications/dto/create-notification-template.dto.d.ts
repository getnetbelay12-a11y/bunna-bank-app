import { NotificationCategory, NotificationChannel, NotificationTemplateType } from '../../../common/enums';
export declare class CreateNotificationTemplateDto {
    category: NotificationCategory;
    templateType: NotificationTemplateType;
    title: string;
    subject?: string;
    messageBody: string;
    channelDefaults: NotificationChannel[];
    isActive?: boolean;
}
