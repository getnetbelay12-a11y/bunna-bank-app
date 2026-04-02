import { NotificationCategory, NotificationChannel, NotificationTemplateType } from '../../common/enums';
export type NotificationTemplateDefinition = {
    category: NotificationCategory;
    templateType: NotificationTemplateType;
    title: string;
    subject: string;
    messageBody: string;
    channelDefaults: NotificationChannel[];
    templateFile: string;
};
export declare const NOTIFICATION_TEMPLATE_DEFINITIONS: NotificationTemplateDefinition[];
export declare function getNotificationTemplateDefinition(templateType: NotificationTemplateType | string): NotificationTemplateDefinition | undefined;
