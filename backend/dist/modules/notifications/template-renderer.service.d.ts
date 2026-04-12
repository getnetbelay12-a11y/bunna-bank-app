import { NotificationTemplateType } from '../../common/enums';
import { MemberDocument } from '../members/schemas/member.schema';
import { type EmailAttachmentAsset } from './email-branding';
type TemplateRenderInput = {
    templateType: NotificationTemplateType | string;
    subject?: string;
    customMessageBody?: string;
    member: MemberDocument;
};
export type RenderedNotificationContent = {
    subject: string;
    emailHtml: string;
    emailText: string;
    inAppTitle: string;
    inAppMessage: string;
    smsMessage: string;
    telegramMessage: string;
    logMessageBody: string;
    emailAttachments?: EmailAttachmentAsset[];
    emailLogoSrc: string;
    emailLogoStrategy: 'cid' | 'fallback_data_url';
};
export declare class TemplateRendererService {
    private readonly logger;
    private readonly repoRoot;
    private readonly templateDir;
    private readonly layoutTemplate;
    private readonly logoAsset;
    private readonly colors;
    render(input: TemplateRenderInput): RenderedNotificationContent;
    private buildTemplateData;
    private buildAmharicContent;
    private buildInAppMessage;
    private buildSmsMessage;
    private buildTelegramMessage;
    private buildEmailText;
    private prependInfoNote;
    private wrapHtml;
    private buildAmharicIntroMessage;
    private readTemplate;
    private interpolate;
    private escapeHtml;
    private formatDate;
    private daysFromNow;
    private resolveEmailLogo;
    private resolveAmharicCustomerName;
}
export {};
