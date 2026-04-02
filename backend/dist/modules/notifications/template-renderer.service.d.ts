import { NotificationTemplateType } from '../../common/enums';
import { MemberDocument } from '../members/schemas/member.schema';
type TemplateRenderInput = {
    templateType: NotificationTemplateType | string;
    subject?: string;
    customMessageBody?: string;
    member: MemberDocument;
    useDemoContent?: boolean;
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
};
export declare class TemplateRendererService {
    private readonly logoCid;
    private readonly repoRoot;
    private readonly templateDir;
    private readonly layoutTemplate;
    render(input: TemplateRenderInput): RenderedNotificationContent;
    private buildTemplateData;
    private buildAmharicContent;
    private buildInAppMessage;
    private buildSmsMessage;
    private buildTelegramMessage;
    private buildEmailText;
    private prependInfoNote;
    private wrapHtml;
    private translateCustomNote;
    private readTemplate;
    private interpolate;
    private escapeHtml;
    private formatDate;
    private daysFromNow;
}
export {};
