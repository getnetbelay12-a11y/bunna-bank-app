"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TemplateRendererService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRendererService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const enums_1 = require("../../common/enums");
const notification_template_registry_1 = require("./notification-template.registry");
const email_branding_1 = require("./email-branding");
let TemplateRendererService = TemplateRendererService_1 = class TemplateRendererService {
    constructor() {
        this.logger = new common_1.Logger(TemplateRendererService_1.name);
        this.repoRoot = (0, path_1.join)(__dirname, '..', '..', '..', '..');
        this.templateDir = (0, path_1.join)(this.repoRoot, 'templates', 'notifications');
        this.layoutTemplate = (0, fs_1.readFileSync)((0, path_1.join)(this.templateDir, '_layout.html'), 'utf8');
        this.logoAsset = (0, email_branding_1.loadBunnaLogoAsset)(this.repoRoot);
        this.colors = {
            pageBackground: email_branding_1.BUNNA_EMAIL_BRAND.colors.pageBackground,
            cardBackground: email_branding_1.BUNNA_EMAIL_BRAND.colors.cardBackground,
            softBackground: email_branding_1.BUNNA_EMAIL_BRAND.colors.softBackground,
            border: email_branding_1.BUNNA_EMAIL_BRAND.colors.border,
            primary: email_branding_1.BUNNA_EMAIL_BRAND.colors.primary,
            primaryDark: email_branding_1.BUNNA_EMAIL_BRAND.colors.primaryDark,
            teal: email_branding_1.BUNNA_EMAIL_BRAND.colors.teal,
            gold: email_branding_1.BUNNA_EMAIL_BRAND.colors.gold,
            title: email_branding_1.BUNNA_EMAIL_BRAND.colors.titleText,
            body: email_branding_1.BUNNA_EMAIL_BRAND.colors.bodyText,
            muted: email_branding_1.BUNNA_EMAIL_BRAND.colors.mutedText,
        };
    }
    render(input) {
        const definition = (0, notification_template_registry_1.getNotificationTemplateDefinition)(input.templateType);
        if (!definition) {
            const fallbackBody = input.customMessageBody ?? 'Bunna Bank reminder';
            return {
                subject: input.subject ?? 'Bunna Bank Notification',
                emailHtml: this.wrapHtml(input.subject ?? 'Bunna Bank Notification', `<p style="margin:0;font-size:16px;line-height:1.65;">${this.escapeHtml(fallbackBody)}</p>`, `<p style="margin:0;font-size:16px;line-height:1.65;">${this.escapeHtml(fallbackBody)}</p>`),
                emailText: fallbackBody,
                inAppTitle: input.subject ?? 'Bunna Bank Notification',
                inAppMessage: fallbackBody,
                smsMessage: fallbackBody,
                telegramMessage: fallbackBody,
                logMessageBody: fallbackBody,
                emailAttachments: this.logoAsset ? [this.logoAsset] : undefined,
                emailLogoSrc: this.resolveEmailLogo().src,
                emailLogoStrategy: this.resolveEmailLogo().strategy,
            };
        }
        const data = this.buildTemplateData(definition, input.member);
        const englishContent = this.interpolate(this.readTemplate(definition.templateFile), data);
        const amharicContent = this.buildAmharicContent(definition, data);
        const subject = input.subject ?? definition.subject;
        const introMessage = input.customMessageBody?.trim();
        const emailHtml = this.wrapHtml(subject, introMessage ? this.prependInfoNote(introMessage, englishContent) : englishContent, introMessage
            ? this.prependInfoNote(this.buildAmharicIntroMessage(definition, data, introMessage), amharicContent)
            : amharicContent);
        const emailLogo = this.resolveEmailLogo();
        this.logger.log(`email logo strategy=${emailLogo.strategy} src=${emailLogo.src} attachment=${this.logoAsset ? 'present' : 'missing'} template=${definition.templateType}`);
        return {
            subject,
            emailHtml,
            emailText: this.buildEmailText(definition, data, introMessage),
            inAppTitle: definition.title,
            inAppMessage: this.buildInAppMessage(definition, data),
            smsMessage: this.buildSmsMessage(definition, data),
            telegramMessage: this.buildTelegramMessage(definition, data),
            logMessageBody: introMessage ?? this.buildInAppMessage(definition, data),
            emailAttachments: this.logoAsset ? [this.logoAsset] : undefined,
            emailLogoSrc: emailLogo.src,
            emailLogoStrategy: emailLogo.strategy,
        };
    }
    buildTemplateData(definition, member) {
        return {
            customerName: member.fullName,
            customerNameAmharic: this.resolveAmharicCustomerName(member),
            paymentAmount: '502,346.00',
            dueDate: this.formatDate(this.daysFromNow(5), 'en-US'),
            dueDateAmharic: this.formatDate(this.daysFromNow(5), 'am-ET'),
            lateInterest: '0.00',
            lateDays: '0',
            paymentDate: this.formatDate(this.daysFromNow(0), 'en-US'),
            paymentDateAmharic: this.formatDate(this.daysFromNow(0), 'am-ET'),
            provider: 'Bunna Insurance',
            providerAmharic: 'አማራ ኢንሹራንስ',
            policyNumber: `${member.customerId}-INS-001`,
            referenceNumber: member.customerId,
            supportCaseId: `SUP-${member.customerId}`,
            supportQueue: 'Digital Support Desk',
            securityChannel: 'iPhone 17 Pro · 127.0.0.1',
            securityTime: this.formatDate(this.daysFromNow(0), 'en-US'),
            securityTimeAmharic: this.formatDate(this.daysFromNow(0), 'am-ET'),
            announcementTitle: 'Quarterly Service and Governance Update',
            audience: 'Linked Bunna Bank customers',
            publishedDate: this.formatDate(this.daysFromNow(0), 'en-US'),
            publishedDateAmharic: this.formatDate(this.daysFromNow(0), 'am-ET'),
            kycAction: 'Re-upload clear Fayda back image',
            branchName: 'Debre Markos Main Branch',
            branchNameAmharic: 'ደብረ ማርቆስ ዋና ቅርንጫፍ',
            autopayServiceType: 'Loan installment AutoPay',
            autopayIssue: 'Funding account balance was not sufficient',
            shareholderEvent: 'Annual Shareholder Vote',
            shareholderStatus: 'Open',
            shareholderClosingDate: this.formatDate(this.daysFromNow(13), 'en-US'),
            shareholderClosingDateAmharic: this.formatDate(this.daysFromNow(13), 'am-ET'),
            renewalDate: this.formatDate(this.daysFromNow(7), 'en-US'),
            renewalDateAmharic: this.formatDate(this.daysFromNow(7), 'am-ET'),
            daysRemaining: definition.category === enums_1.NotificationCategory.INSURANCE ? '7' : '5',
        };
    }
    buildAmharicContent(definition, data) {
        switch (definition.templateType) {
            case enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:${this.colors.body};">ክቡር/ክብርት ${this.escapeHtml(data.customerNameAmharic)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${this.colors.body};">የኢንሹራንስ ፖሊሲዎ የማደስ ጊዜ በ<strong>${this.escapeHtml(data.daysRemaining)}</strong> ቀናት ውስጥ ይደርሳል።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid ${this.colors.border};border-radius:18px;background:${this.colors.softBackground};">
              <div style="margin-bottom:12px;font-size:12px;letter-spacing:0.08em;color:${this.colors.muted};font-weight:800;">የኢንሹራንስ እድሳት ማስታወሻ</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>አቅራቢ:</strong> ${this.escapeHtml(data.providerAmharic)}</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>ፖሊሲ ቁጥር:</strong> ${this.escapeHtml(data.policyNumber)}</div>
              <div style="font-size:15px;color:${this.colors.body};"><strong>የማደስ ቀን:</strong> ${this.escapeHtml(data.renewalDateAmharic)}</div>
            </div>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:${this.colors.body};">ከአንድ በላይ ፖሊሲ ካሉዎት ሲልኩ <strong>ፖሊሲ:${this.escapeHtml(data.policyNumber)}</strong> ብለው በርዕስ ወይም በመግለጫ ውስጥ ያስገቡ።</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:${this.colors.body};">እባክዎ የማደስ ሰነድዎን ፎቶ/PDF በቴሌግራም ይላኩ ወይም በአባሪ ፋይል ለዚህ ኢሜይል ይመልሱ።</p>
            <p style="margin:0;font-size:15px;line-height:1.8;color:${this.colors.body};">እናመሰግናለን፣<br />የኢንሹራንስ አገልግሎት ቡድን<br />አማራ ባንክ</p>
          </section>
        `;
            case enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION:
            case enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:${this.colors.body};">ክቡር/ክብርት ${this.escapeHtml(data.customerNameAmharic)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${this.colors.body};">${definition.templateType === enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE
                    ? 'የትምህርት ክፍያዎ ቀርቧል። እባክዎ የተማሪውን መረጃ ይመልከቱ እና ክፍያውን በወቅቱ ያጠናቅቁ።'
                    : 'ክፍያዎ በተሳካ ሁኔታ ተቀብሏል።'}</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid ${this.colors.border};border-radius:18px;background:${this.colors.softBackground};">
              <div style="margin-bottom:12px;font-size:12px;letter-spacing:0.08em;color:${this.colors.muted};font-weight:800;">${definition.templateType === enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE
                    ? 'የትምህርት ክፍያ ማስታወሻ'
                    : 'የክፍያ ማረጋገጫ'}</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>የዘገየ ክፍያ ወለድ (${this.escapeHtml(data.lateDays)} ቀናት):</strong> ብር ${this.escapeHtml(data.lateInterest)}</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>የክፍያ መጠን:</strong> ብር ${this.escapeHtml(data.paymentAmount)}</div>
              <div style="font-size:15px;color:${this.colors.body};"><strong>የክፍያ ቀን:</strong> ${this.escapeHtml(data.paymentDateAmharic)}</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;color:${this.colors.body};">እናመሰግናለን፣<br />የብድር አገልግሎት ዳይሬክቶሬት<br />አማራ ባንክ</p>
          </section>
        `;
            case enums_1.NotificationTemplateType.PAYMENT_FAILED:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:${this.colors.body};">ክቡር/ክብርት ${this.escapeHtml(data.customerNameAmharic)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${this.colors.body};">የቅርብ ጊዜ ክፍያ ሙከራዎ አልተሳካም። እባክዎ የክፍያ ዝርዝሮቹን ይመልከቱ እና እንደገና ይሞክሩ።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid ${this.colors.border};border-radius:18px;background:${this.colors.softBackground};">
              <div style="margin-bottom:12px;font-size:12px;letter-spacing:0.08em;color:${this.colors.muted};font-weight:800;">ያልተሳካ ክፍያ</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>የክፍያ መጠን:</strong> ብር ${this.escapeHtml(data.paymentAmount)}</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>ማጣቀሻ:</strong> ${this.escapeHtml(data.referenceNumber)}</div>
              <div style="font-size:15px;color:${this.colors.body};"><strong>ቀጣይ እርምጃ:</strong> የሂሳብ ቀሪን ወይም የክፍያ ምንጩን ይመልከቱ</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;color:${this.colors.body};">እናመሰግናለን፣<br />የክፍያ ኦፕሬሽን ቡድን<br />አማራ ባንክ</p>
          </section>
        `;
            case enums_1.NotificationTemplateType.SUPPORT_REPLY:
            case enums_1.NotificationTemplateType.SUPPORT_ASSIGNED:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:${this.colors.body};">ክቡር/ክብርት ${this.escapeHtml(data.customerNameAmharic)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${this.colors.body};">${definition.templateType === enums_1.NotificationTemplateType.SUPPORT_ASSIGNED
                    ? 'የድጋፍ ጉዳይዎ ለባለሙያ ተመድቧል።'
                    : 'የድጋፍ ጉዳይዎን በተመለከተ ምላሽ ተደርጓል።'}</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid ${this.colors.border};border-radius:18px;background:${this.colors.softBackground};">
              <div style="margin-bottom:12px;font-size:12px;letter-spacing:0.08em;color:${this.colors.muted};font-weight:800;">የድጋፍ ዝርዝር</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>የጉዳይ ቁጥር:</strong> ${this.escapeHtml(data.supportCaseId)}</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>የአገልግሎት መስመር:</strong> ${this.escapeHtml(data.supportQueue)}</div>
              <div style="font-size:15px;color:${this.colors.body};"><strong>ቀጣይ እርምጃ:</strong> መተግበሪያውን ይክፈቱ እና ምላሹን ይመልከቱ</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;color:${this.colors.body};">እናመሰግናለን፣<br />የድጋፍ ቡድን<br />አማራ ባንክ</p>
          </section>
        `;
            case enums_1.NotificationTemplateType.LOGIN_DETECTED:
            case enums_1.NotificationTemplateType.ACCOUNT_LOCKED:
            case enums_1.NotificationTemplateType.ACCOUNT_UNLOCKED:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:${this.colors.body};">ክቡር/ክብርት ${this.escapeHtml(data.customerNameAmharic)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${this.colors.body};">${definition.templateType === enums_1.NotificationTemplateType.LOGIN_DETECTED
                    ? 'አዲስ የመግቢያ እንቅስቃሴ ተገኝቷል።'
                    : definition.templateType === enums_1.NotificationTemplateType.ACCOUNT_LOCKED
                        ? 'ሂሳብዎ ለደህንነት ምክንያት ተዘግቷል።'
                        : 'ሂሳብዎ እንደገና ተከፍቷል።'}</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid ${this.colors.border};border-radius:18px;background:${this.colors.softBackground};">
              <div style="margin-bottom:12px;font-size:12px;letter-spacing:0.08em;color:${this.colors.muted};font-weight:800;">የደህንነት ዝርዝር</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>ሰርጥ:</strong> ${this.escapeHtml(data.securityChannel)}</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>ጊዜ:</strong> ${this.escapeHtml(data.securityTimeAmharic)}</div>
              <div style="font-size:15px;color:${this.colors.body};"><strong>ቀጣይ እርምጃ:</strong> እርስዎ ካልሆኑ የይለፍ ቃል ይቀይሩ</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;color:${this.colors.body};">እናመሰግናለን፣<br />የደህንነት ቁጥጥር ቡድን<br />አማራ ባንክ</p>
          </section>
        `;
            case enums_1.NotificationTemplateType.ANNOUNCEMENT:
            case enums_1.NotificationTemplateType.CAMPAIGN:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:${this.colors.body};">ክቡር/ክብርት ${this.escapeHtml(data.customerNameAmharic)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${this.colors.body};">አዲስ የስርዓት ማስታወቂያ ወይም የአገልግሎት ዝመና ቀርቧል።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid ${this.colors.border};border-radius:18px;background:${this.colors.softBackground};">
              <div style="margin-bottom:12px;font-size:12px;letter-spacing:0.08em;color:${this.colors.muted};font-weight:800;">የስርዓት ማስታወቂያ</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>ርዕስ:</strong> ${this.escapeHtml(data.announcementTitle)}</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>ተቀባይ:</strong> ${this.escapeHtml(data.audience)}</div>
              <div style="font-size:15px;color:${this.colors.body};"><strong>የተለቀቀበት ቀን:</strong> ${this.escapeHtml(data.publishedDateAmharic)}</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;color:${this.colors.body};">እናመሰግናለን፣<br />የዲጂታል አገልግሎት ቡድን<br />አማራ ባንክ</p>
          </section>
        `;
            case enums_1.NotificationTemplateType.KYC_PENDING_REMINDER:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:${this.colors.body};">ክቡር/ክብርት ${this.escapeHtml(data.customerNameAmharic)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${this.colors.body};">የKYC ግምገማዎ ተጨማሪ እርምጃ ይፈልጋል።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid ${this.colors.border};border-radius:18px;background:${this.colors.softBackground};">
              <div style="margin-bottom:12px;font-size:12px;letter-spacing:0.08em;color:${this.colors.muted};font-weight:800;">የKYC ዝርዝር</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>ደንበኛ ቁጥር:</strong> ${this.escapeHtml(data.referenceNumber)}</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>የሚፈለገው እርምጃ:</strong> ${this.escapeHtml(data.kycAction)}</div>
              <div style="font-size:15px;color:${this.colors.body};"><strong>ቅርንጫፍ:</strong> ${this.escapeHtml(data.branchNameAmharic)}</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;color:${this.colors.body};">እናመሰግናለን፣<br />የKYC ግምገማ ቡድን<br />አማራ ባንክ</p>
          </section>
        `;
            case enums_1.NotificationTemplateType.AUTOPAY_FAILURE_REMINDER:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:${this.colors.body};">ክቡር/ክብርት ${this.escapeHtml(data.customerNameAmharic)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${this.colors.body};">የተያዘው የAutoPay ክፍያ አልተሳካም።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid ${this.colors.border};border-radius:18px;background:${this.colors.softBackground};">
              <div style="margin-bottom:12px;font-size:12px;letter-spacing:0.08em;color:${this.colors.muted};font-weight:800;">የAutoPay ዝርዝር</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>አይነት:</strong> ${this.escapeHtml(data.autopayServiceType)}</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>ማጣቀሻ:</strong> ${this.escapeHtml(data.referenceNumber)}</div>
              <div style="font-size:15px;color:${this.colors.body};"><strong>ችግር:</strong> ${this.escapeHtml(data.autopayIssue)}</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;color:${this.colors.body};">እናመሰግናለን፣<br />የክፍያ ኦፕሬሽን ቡድን<br />አማራ ባንክ</p>
          </section>
        `;
            case enums_1.NotificationTemplateType.LOAN_DUE_SOON:
            case enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER:
            default:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:${this.colors.body};">ሰላም ${this.escapeHtml(data.customerNameAmharic)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${this.colors.body};">የብድር ክፍያዎ ቀን ቀርቧል። እባክዎ ከታች ያለውን የክፍያ መረጃ ይመልከቱ።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid ${this.colors.border};border-radius:18px;background:${this.colors.softBackground};">
              <div style="margin-bottom:12px;font-size:12px;letter-spacing:0.08em;color:${this.colors.muted};font-weight:800;">የብድር ክፍያ ማስታወሻ</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>የክፍያ መጠን:</strong> ብር ${this.escapeHtml(data.paymentAmount)}</div>
              <div style="margin-bottom:10px;font-size:15px;color:${this.colors.body};"><strong>የመጨረሻ ቀን:</strong> ${this.escapeHtml(data.dueDateAmharic)}</div>
              <div style="font-size:15px;color:${this.colors.body};"><strong>ማጣቀሻ ቁጥር:</strong> ${this.escapeHtml(data.referenceNumber)}</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;color:${this.colors.body};">እናመሰግናለን፣<br />የብድር አገልግሎት ዳይሬክቶሬት<br />አማራ ባንክ</p>
          </section>
        `;
        }
    }
    buildInAppMessage(definition, data) {
        switch (definition.templateType) {
            case enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
                return `Your insurance policy ${data.policyNumber} expires in ${data.daysRemaining} days.`;
            case enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION:
                return `We received your ETB ${data.paymentAmount} payment on ${data.paymentDate}.`;
            case enums_1.NotificationTemplateType.PAYMENT_FAILED:
                return `A payment of ETB ${data.paymentAmount} could not be completed. Review reference ${data.referenceNumber} and retry.`;
            case enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE:
                return `School fee reminder: ETB ${data.paymentAmount} is due on ${data.dueDate}. Open School Pay to review and pay.`;
            case enums_1.NotificationTemplateType.SUPPORT_REPLY:
            case enums_1.NotificationTemplateType.SUPPORT_ASSIGNED:
                return `Support case ${data.supportCaseId} has an update from ${data.supportQueue}.`;
            case enums_1.NotificationTemplateType.LOGIN_DETECTED:
            case enums_1.NotificationTemplateType.ACCOUNT_LOCKED:
            case enums_1.NotificationTemplateType.ACCOUNT_UNLOCKED:
                return `Security alert: account activity was recorded via ${data.securityChannel} on ${data.securityTime}.`;
            case enums_1.NotificationTemplateType.ANNOUNCEMENT:
            case enums_1.NotificationTemplateType.CAMPAIGN:
                return `System announcement: ${data.announcementTitle} is available for ${data.audience}.`;
            case enums_1.NotificationTemplateType.KYC_PENDING_REMINDER:
                return `KYC action needed: ${data.kycAction}. Visit ${data.branchName} if manual review is required.`;
            case enums_1.NotificationTemplateType.AUTOPAY_FAILURE_REMINDER:
                return `AutoPay failed for ${data.autopayServiceType}. Review ${data.autopayIssue.toLowerCase()} and retry.`;
            case enums_1.NotificationTemplateType.SHAREHOLDER_VOTE:
                return `${data.shareholderEvent} is ${data.shareholderStatus.toLowerCase()}. Review the agenda before ${data.shareholderClosingDate}.`;
            case enums_1.NotificationTemplateType.LOAN_DUE_SOON:
            case enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER:
            default:
                return `Your loan payment of ETB ${data.paymentAmount} is due on ${data.dueDate}.`;
        }
    }
    buildSmsMessage(definition, data) {
        switch (definition.templateType) {
            case enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
                return `Bunna Bank: Your insurance policy ${data.policyNumber} is due for renewal on ${data.renewalDate}.`;
            case enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION:
                return `Bunna Bank: We received your ETB ${data.paymentAmount} payment on ${data.paymentDate}.`;
            case enums_1.NotificationTemplateType.PAYMENT_FAILED:
                return `Bunna Bank: A payment of ETB ${data.paymentAmount} failed. Review reference ${data.referenceNumber} and retry.`;
            case enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE:
                return `Bunna Bank: School fee of ETB ${data.paymentAmount} is due on ${data.dueDate}. Open School Pay to review and pay.`;
            case enums_1.NotificationTemplateType.SUPPORT_REPLY:
            case enums_1.NotificationTemplateType.SUPPORT_ASSIGNED:
                return `Bunna Bank: Support case ${data.supportCaseId} has an update from ${data.supportQueue}.`;
            case enums_1.NotificationTemplateType.LOGIN_DETECTED:
            case enums_1.NotificationTemplateType.ACCOUNT_LOCKED:
            case enums_1.NotificationTemplateType.ACCOUNT_UNLOCKED:
                return `Bunna Bank: Security alert recorded via ${data.securityChannel} on ${data.securityTime}.`;
            case enums_1.NotificationTemplateType.ANNOUNCEMENT:
            case enums_1.NotificationTemplateType.CAMPAIGN:
                return `Bunna Bank: ${data.announcementTitle} is available for ${data.audience}.`;
            case enums_1.NotificationTemplateType.KYC_PENDING_REMINDER:
                return `Bunna Bank: KYC action needed: ${data.kycAction}. Visit ${data.branchName} if manual review is required.`;
            case enums_1.NotificationTemplateType.AUTOPAY_FAILURE_REMINDER:
                return `Bunna Bank: AutoPay failed for ${data.autopayServiceType}. Review the payment source and retry.`;
            case enums_1.NotificationTemplateType.SHAREHOLDER_VOTE:
                return `Bunna Bank: ${data.shareholderEvent} is ${data.shareholderStatus.toLowerCase()} until ${data.shareholderClosingDate}.`;
            case enums_1.NotificationTemplateType.LOAN_DUE_SOON:
            case enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER:
            default:
                return `Bunna Bank: Your loan payment of ETB ${data.paymentAmount} is due on ${data.dueDate}.`;
        }
    }
    buildTelegramMessage(definition, data) {
        switch (definition.templateType) {
            case enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
                return [
                    'Bunna Bank',
                    '',
                    'Insurance Renewal Reminder',
                    '',
                    `Dear ${data.customerName},`,
                    'Your insurance policy is approaching renewal.',
                    '',
                    `Provider: ${data.provider}`,
                    `Policy Number: ${data.policyNumber}`,
                    `Renewal Due Date: ${data.renewalDate}`,
                    '',
                    'Please complete renewal before the deadline.',
                    '',
                    'አማራ ባንክ',
                    '',
                    'የኢንሹራንስ እድሳት ማስታወሻ',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    'የኢንሹራንስ ፖሊሲዎ የማደስ ጊዜ ቀርቧል።',
                    '',
                    `አቅራቢ: ${data.providerAmharic}`,
                    `ፖሊሲ ቁጥር: ${data.policyNumber}`,
                    `የማደስ ቀን: ${data.renewalDateAmharic}`,
                    '',
                    'እባክዎ ከቀነ ገደቡ በፊት እድሳቱን ያጠናቅቁ።',
                ].join('\n');
            case enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION:
                return [
                    'Bunna Bank',
                    '',
                    'Payment Confirmation',
                    '',
                    `Dear ${data.customerName},`,
                    `Payment Amount: ETB ${data.paymentAmount}`,
                    `Payment Date: ${data.paymentDate}`,
                    '',
                    'Thank you for banking with Bunna Bank.',
                    '',
                    'አማራ ባንክ',
                    '',
                    'የክፍያ ማረጋገጫ',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    `የክፍያ መጠን: ብር ${data.paymentAmount}`,
                    `የክፍያ ቀን: ${data.paymentDateAmharic}`,
                    '',
                    'ከአማራ ባንክ ጋር ስለሚሰሩ እናመሰግናለን።',
                ].join('\n');
            case enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE:
                return [
                    'Bunna Bank',
                    '',
                    'School Fee Reminder',
                    '',
                    `Dear ${data.customerName},`,
                    `School fee amount: ETB ${data.paymentAmount}`,
                    `Due Date: ${data.dueDate}`,
                    'Open School Pay in the Bunna Bank app to review and complete payment.',
                    '',
                    'አማራ ባንክ',
                    '',
                    'የትምህርት ክፍያ ማስታወሻ',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    `የክፍያ መጠን: ብር ${data.paymentAmount}`,
                    `የመጨረሻ ቀን: ${data.dueDateAmharic}`,
                    'እባክዎ የትምህርት ክፍያ ክፍልን በመክፈት ክፍያውን ያጠናቅቁ።',
                ].join('\n');
            case enums_1.NotificationTemplateType.PAYMENT_FAILED:
                return [
                    'Bunna Bank',
                    '',
                    'Payment Failure Alert',
                    '',
                    `Dear ${data.customerName},`,
                    'A recent payment attempt could not be completed.',
                    '',
                    `Amount: ETB ${data.paymentAmount}`,
                    `Reference: ${data.referenceNumber}`,
                    'Next Step: Review the payment source and retry the transaction.',
                    '',
                    'አማራ ባንክ',
                    '',
                    'ያልተሳካ ክፍያ',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    'የቅርብ ጊዜ ክፍያ ሙከራዎ አልተሳካም።',
                    '',
                    `የክፍያ መጠን: ብር ${data.paymentAmount}`,
                    `ማጣቀሻ: ${data.referenceNumber}`,
                    'ቀጣይ እርምጃ: የክፍያ ምንጩን ይመልከቱ እና እንደገና ይሞክሩ።',
                ].join('\n');
            case enums_1.NotificationTemplateType.SUPPORT_REPLY:
            case enums_1.NotificationTemplateType.SUPPORT_ASSIGNED:
                return [
                    'Bunna Bank',
                    '',
                    definition.templateType === enums_1.NotificationTemplateType.SUPPORT_ASSIGNED
                        ? 'Support Case Assigned'
                        : 'Support Reply Available',
                    '',
                    `Dear ${data.customerName},`,
                    `Support case ${data.supportCaseId} has an update from ${data.supportQueue}.`,
                    'Open the app to review the latest message and continue the conversation.',
                    '',
                    'አማራ ባንክ',
                    '',
                    'የድጋፍ ዝማኔ',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    `የድጋፍ ጉዳይ ${data.supportCaseId} በ${data.supportQueue} ዝማኔ አለው።`,
                    'እባክዎ መተግበሪያውን ይክፈቱ እና ምላሹን ይመልከቱ።',
                ].join('\n');
            case enums_1.NotificationTemplateType.LOGIN_DETECTED:
            case enums_1.NotificationTemplateType.ACCOUNT_LOCKED:
            case enums_1.NotificationTemplateType.ACCOUNT_UNLOCKED:
                return [
                    'Bunna Bank',
                    '',
                    'Security Alert',
                    '',
                    `Dear ${data.customerName},`,
                    'A security-related account event was recorded.',
                    '',
                    `Channel: ${data.securityChannel}`,
                    `Time: ${data.securityTime}`,
                    'If this was not you, change your password immediately.',
                    '',
                    'አማራ ባንክ',
                    '',
                    'የደህንነት ማስታወቂያ',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    'የደህንነት ጋር የተያያዘ የሂሳብ እንቅስቃሴ ተመዝግቧል።',
                    '',
                    `ሰርጥ: ${data.securityChannel}`,
                    `ጊዜ: ${data.securityTimeAmharic}`,
                    'እርስዎ ካልሆኑ የይለፍ ቃልዎን ይቀይሩ።',
                ].join('\n');
            case enums_1.NotificationTemplateType.ANNOUNCEMENT:
            case enums_1.NotificationTemplateType.CAMPAIGN:
                return [
                    'Bunna Bank',
                    '',
                    'System Announcement',
                    '',
                    `Dear ${data.customerName},`,
                    `${data.announcementTitle} is available in your Bunna Bank app.`,
                    '',
                    `Audience: ${data.audience}`,
                    `Published: ${data.publishedDate}`,
                    'Open the app to review the full update.',
                    '',
                    'አማራ ባንክ',
                    '',
                    'የስርዓት ማስታወቂያ',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    `${data.announcementTitle} በአማራ ባንክ መተግበሪያዎ ውስጥ ተገኝቷል።`,
                    '',
                    `ተቀባይ: ${data.audience}`,
                    `የታተመበት ቀን: ${data.publishedDateAmharic}`,
                    'ዝርዝሩን ለማየት መተግበሪያውን ይክፈቱ።',
                ].join('\n');
            case enums_1.NotificationTemplateType.KYC_PENDING_REMINDER:
                return [
                    'Bunna Bank',
                    '',
                    'KYC Pending Reminder',
                    '',
                    `Dear ${data.customerName},`,
                    'Your onboarding review needs additional action.',
                    '',
                    `Customer ID: ${data.referenceNumber}`,
                    `Required Action: ${data.kycAction}`,
                    `Branch: ${data.branchName}`,
                    '',
                    'Complete the requested KYC action to unlock secure services.',
                    '',
                    'አማራ ባንክ',
                    '',
                    'የKYC ማስታወሻ',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    'የKYC ግምገማዎ ተጨማሪ እርምጃ ይፈልጋል።',
                    '',
                    `የደንበኛ ቁጥር: ${data.referenceNumber}`,
                    `የሚፈለገው እርምጃ: ${data.kycAction}`,
                    `ቅርንጫፍ: ${data.branchNameAmharic}`,
                    '',
                    'የተጠየቀውን የKYC እርምጃ ይጨርሱ።',
                ].join('\n');
            case enums_1.NotificationTemplateType.AUTOPAY_FAILURE_REMINDER:
                return [
                    'Bunna Bank',
                    '',
                    'AutoPay Failure Reminder',
                    '',
                    `Dear ${data.customerName},`,
                    'Your scheduled AutoPay could not be completed.',
                    '',
                    `Payment Type: ${data.autopayServiceType}`,
                    `Reference: ${data.referenceNumber}`,
                    `Issue: ${data.autopayIssue}`,
                    '',
                    'Please review the funding source and retry before the next due date.',
                    '',
                    'አማራ ባንክ',
                    '',
                    'የAutoPay ማስታወሻ',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    'የተያዘው የAutoPay ክፍያ አልተሳካም።',
                    '',
                    `አይነት: ${data.autopayServiceType}`,
                    `ማጣቀሻ: ${data.referenceNumber}`,
                    `ችግር: ${data.autopayIssue}`,
                    '',
                    'እባክዎ የክፍያ ምንጩን ይመልከቱ እና እንደገና ይሞክሩ።',
                ].join('\n');
            case enums_1.NotificationTemplateType.SHAREHOLDER_VOTE:
                return [
                    'Bunna Bank',
                    '',
                    'Shareholder Voting Update',
                    '',
                    `Dear ${data.customerName},`,
                    'A shareholder voting event or governance update is available in your Bunna Bank app.',
                    '',
                    `Event: ${data.shareholderEvent}`,
                    `Status: ${data.shareholderStatus}`,
                    `Closing Date: ${data.shareholderClosingDate}`,
                    'Open the voting workspace to review the agenda, timeline, and participation details.',
                    '',
                    'Thank you,',
                    'Shareholder Relations Department',
                    'Bunna Bank',
                    '',
                    'አማራ ባንክ',
                    '',
                    'የባለአክሲዮን ድምጽ መስጫ ዝመና',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    'በአማራ ባንክ መተግበሪያዎ ውስጥ የባለአክሲዮን ድምጽ መስጫ ወይም የአስተዳደር ዝመና ቀርቧል።',
                    '',
                    `ክስተት: ${data.shareholderEvent}`,
                    `ሁኔታ: ${data.shareholderStatus}`,
                    `የመዝጊያ ቀን: ${data.shareholderClosingDateAmharic}`,
                    'እባክዎ የአጀንዳ ዝርዝርን፣ የጊዜ ሰሌዳውን እና የተሳትፎ መረጃዎችን ለማየት የድምጽ መስጫ ክፍሉን ይክፈቱ።',
                    '',
                    'ከአክብሮት ጋር,',
                    'የባለአክሲዮን ግንኙነት ዲፓርትመንት',
                    'አማራ ባንክ',
                ].join('\n');
            case enums_1.NotificationTemplateType.LOAN_DUE_SOON:
            case enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER:
            default:
                return [
                    'Bunna Bank',
                    '',
                    'Loan Payment Reminder',
                    '',
                    `Dear ${data.customerName},`,
                    'Your loan payment is due soon.',
                    '',
                    `Amount: ETB ${data.paymentAmount}`,
                    `Due Date: ${data.dueDate}`,
                    `Reference: ${data.referenceNumber}`,
                    '',
                    'Please make payment before the due date.',
                    '',
                    'አማራ ባንክ',
                    '',
                    'የብድር ክፍያ ማስታወሻ',
                    '',
                    `ክቡር/ክብርት ${data.customerNameAmharic},`,
                    'የብድር ክፍያዎ ቀን ቀርቧል።',
                    '',
                    `የክፍያ መጠን: ብር ${data.paymentAmount}`,
                    `የመጨረሻ ቀን: ${data.dueDateAmharic}`,
                    `ማጣቀሻ ቁጥር: ${data.referenceNumber}`,
                    '',
                    'እባክዎ ከመጨረሻ ቀኑ በፊት ክፍያውን ያጠናቅቁ።',
                ].join('\n');
        }
    }
    buildEmailText(definition, data, introMessage) {
        const lines = [definition.subject];
        if (introMessage) {
            lines.push('', introMessage);
        }
        switch (definition.templateType) {
            case enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
                lines.push('', `Dear ${data.customerName},`, `Your insurance policy renewal is due in ${data.daysRemaining} days.`, `Provider: ${data.provider}`, `Policy Number: ${data.policyNumber}`, `Renewal Due Date: ${data.renewalDate}`);
                break;
            case enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION:
                lines.push('', `Dear ${data.customerName},`, 'We have successfully received your payment.', `Late Payment Interest (${data.lateDays} days overdue): ETB ${data.lateInterest}`, `Payment Amount: ETB ${data.paymentAmount}`, `Payment Date: ${data.paymentDate}`);
                break;
            case enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE:
                lines.push('', `Dear ${data.customerName},`, 'Your school fee is due soon.', `Payment Amount: ETB ${data.paymentAmount}`, `Due Date: ${data.dueDate}`, 'Open School Pay in the Bunna Bank app to review and complete payment.');
                break;
            case enums_1.NotificationTemplateType.PAYMENT_FAILED:
                lines.push('', `Hello ${data.customerName},`, 'A recent payment attempt could not be completed.', `Payment Amount: ETB ${data.paymentAmount}`, `Reference: ${data.referenceNumber}`, 'Next Step: Review the payment source and retry the transaction.');
                break;
            case enums_1.NotificationTemplateType.SUPPORT_REPLY:
            case enums_1.NotificationTemplateType.SUPPORT_ASSIGNED:
                lines.push('', `Hello ${data.customerName},`, `Support case ${data.supportCaseId} has an update from ${data.supportQueue}.`, 'Open the app to review the latest message and continue the conversation.');
                break;
            case enums_1.NotificationTemplateType.LOGIN_DETECTED:
            case enums_1.NotificationTemplateType.ACCOUNT_LOCKED:
            case enums_1.NotificationTemplateType.ACCOUNT_UNLOCKED:
                lines.push('', `Hello ${data.customerName},`, 'A security-related account event was recorded.', `Channel: ${data.securityChannel}`, `Time: ${data.securityTime}`, 'If this was not you, change your password immediately.');
                break;
            case enums_1.NotificationTemplateType.ANNOUNCEMENT:
            case enums_1.NotificationTemplateType.CAMPAIGN:
                lines.push('', `Hello ${data.customerName},`, `${data.announcementTitle} is available in your Bunna Bank app.`, `Audience: ${data.audience}`, `Published: ${data.publishedDate}`, 'Open the app to review the full update.');
                break;
            case enums_1.NotificationTemplateType.KYC_PENDING_REMINDER:
                lines.push('', `Hello ${data.customerName},`, 'Your onboarding review needs additional action.', `Customer ID: ${data.referenceNumber}`, `Required Action: ${data.kycAction}`, `Branch: ${data.branchName}`);
                break;
            case enums_1.NotificationTemplateType.AUTOPAY_FAILURE_REMINDER:
                lines.push('', `Hello ${data.customerName},`, 'Your scheduled AutoPay could not be completed.', `Payment Type: ${data.autopayServiceType}`, `Reference: ${data.referenceNumber}`, `Issue: ${data.autopayIssue}`);
                break;
            case enums_1.NotificationTemplateType.SHAREHOLDER_VOTE:
                lines.push('', `Hello ${data.customerName},`, 'A shareholder voting event or governance update is available in your Bunna Bank app.', `Event: ${data.shareholderEvent}`, `Status: ${data.shareholderStatus}`, `Closing Date: ${data.shareholderClosingDate}`, 'Open the voting workspace to review the agenda, schedule, and participation details.');
                break;
            default:
                lines.push('', `Hello ${data.customerName},`, 'Your loan payment details are below:', `Payment Amount: ETB ${data.paymentAmount}`, `Due Date: ${data.dueDate}`);
        }
        return lines.join('\n');
    }
    prependInfoNote(note, content) {
        return `<div style="margin:0 0 18px;padding:14px 16px;border-radius:14px;background:${this.colors.softBackground};border:1px solid ${this.colors.border};color:${this.colors.body};font-size:15px;line-height:1.65;">${this.escapeHtml(note)}</div>${content}`;
    }
    wrapHtml(title, englishContent, amharicContent) {
        const emailLogo = this.resolveEmailLogo();
        return this.interpolate(this.layoutTemplate, {
            title,
            logoUrl: emailLogo.src,
            englishContent,
            amharicContent,
        }, ['englishContent', 'amharicContent']);
    }
    buildAmharicIntroMessage(definition, data, fallbackNote) {
        switch (definition.templateType) {
            case enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
                return `የኢንሹራንስ ፖሊሲዎ የማደስ ጊዜ ቀርቧል። ከታች ያለውን የፖሊሲ መረጃ ይመልከቱ እና እድሳቱን በወቅቱ ያጠናቅቁ።`;
            case enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION:
                return `የ${data.paymentAmount} ብር ክፍያዎ በ${data.paymentDateAmharic} በተሳካ ሁኔታ ተቀብሏል።`;
            case enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE:
                return `የትምህርት ክፍያዎ ቀርቧል። የክፍያ መጠን ብር ${data.paymentAmount} ነው እና የመጨረሻ ቀኑ ${data.dueDateAmharic} ነው።`;
            case enums_1.NotificationTemplateType.PAYMENT_FAILED:
                return `የክፍያ ሙከራዎ አልተሳካም። ማጣቀሻ ${data.referenceNumber} በመጠቀም እባክዎ እንደገና ይሞክሩ።`;
            case enums_1.NotificationTemplateType.SUPPORT_REPLY:
            case enums_1.NotificationTemplateType.SUPPORT_ASSIGNED:
                return `የድጋፍ ጉዳይ ${data.supportCaseId} ዝማኔ አለው። እባክዎ መተግበሪያውን ይክፈቱ።`;
            case enums_1.NotificationTemplateType.LOGIN_DETECTED:
            case enums_1.NotificationTemplateType.ACCOUNT_LOCKED:
            case enums_1.NotificationTemplateType.ACCOUNT_UNLOCKED:
                return `የደህንነት ማስታወቂያ: በ${data.securityTimeAmharic} በ${data.securityChannel} የሂሳብ እንቅስቃሴ ተመዝግቧል።`;
            case enums_1.NotificationTemplateType.ANNOUNCEMENT:
            case enums_1.NotificationTemplateType.CAMPAIGN:
                return `አዲስ የስርዓት ማስታወቂያ ቀርቧል። ${data.announcementTitle} ን ለማየት መተግበሪያውን ይክፈቱ።`;
            case enums_1.NotificationTemplateType.KYC_PENDING_REMINDER:
                return `የKYC ግምገማዎ ተጨማሪ እርምጃ ይፈልጋል። የሚፈለገው: ${data.kycAction}።`;
            case enums_1.NotificationTemplateType.AUTOPAY_FAILURE_REMINDER:
                return `የAutoPay ክፍያዎ አልተሳካም። ችግሩ: ${data.autopayIssue}።`;
            case enums_1.NotificationTemplateType.SHAREHOLDER_VOTE:
                return `${data.shareholderEvent} ክፍት ነው። ከ${data.shareholderClosingDateAmharic} በፊት ዝርዝሩን ይመልከቱ።`;
            case enums_1.NotificationTemplateType.LOAN_DUE_SOON:
            case enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER:
                return `የብድር ክፍያዎ ቀን ቀርቧል። እባክዎ የሚከፈለውን መጠን እና የመጨረሻ ቀኑን ይመልከቱ እና ክፍያውን በወቅቱ ያጠናቅቁ።`;
            default:
                return `ማስታወሻ: ${fallbackNote}`;
        }
    }
    readTemplate(fileName) {
        return (0, fs_1.readFileSync)((0, path_1.join)(this.templateDir, fileName), 'utf8');
    }
    interpolate(template, data, rawKeys = []) {
        return template.replace(/{{\s*([\w]+)\s*}}/g, (_match, key) => data[key] !== undefined
            ? rawKeys.includes(key)
                ? data[key]
                : this.escapeHtml(data[key])
            : '');
    }
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    formatDate(date, locale = 'en-US') {
        return new Intl.DateTimeFormat(locale, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }).format(date);
    }
    daysFromNow(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
    }
    resolveEmailLogo() {
        if (this.logoAsset?.cid) {
            return {
                strategy: 'cid',
                src: `cid:${this.logoAsset.cid}`,
            };
        }
        return {
            strategy: 'fallback_data_url',
            src: (0, email_branding_1.buildBunnaLogoFallbackDataUrl)(),
        };
    }
    resolveAmharicCustomerName(member) {
        const knownFullNameMap = {
            'Selamawit Molla': 'ሰላማዊት ሞላ',
            'Abebe Kebede': 'አበበ ከበደ',
            'Meseret Alemu': 'መሰረት አለሙ',
            'Mekdes Ali': 'መቅደስ አሊ',
            'Getnet Belay': 'ጌትነት በላይ',
            'Rahel Tesfaye': 'ራሄል ተስፋዬ',
            'Tigist Hailu': 'ትግስት ሃይሉ',
        };
        const normalizedFullName = member.fullName.trim();
        if (knownFullNameMap[normalizedFullName]) {
            return knownFullNameMap[normalizedFullName];
        }
        const knownPartMap = {
            Selamawit: 'ሰላማዊት',
            Molla: 'ሞላ',
            Abebe: 'አበበ',
            Kebede: 'ከበደ',
            Meseret: 'መሰረት',
            Alemu: 'አለሙ',
            Mekdes: 'መቅደስ',
            Ali: 'አሊ',
            Getnet: 'ጌትነት',
            Belay: 'በላይ',
            Rahel: 'ራሄል',
            Tesfaye: 'ተስፋዬ',
            Tigist: 'ትግስት',
            Hailu: 'ሃይሉ',
        };
        const translatedParts = normalizedFullName
            .split(/\s+/)
            .map((part) => knownPartMap[part] ?? part);
        return translatedParts.join(' ');
    }
};
exports.TemplateRendererService = TemplateRendererService;
exports.TemplateRendererService = TemplateRendererService = TemplateRendererService_1 = __decorate([
    (0, common_1.Injectable)()
], TemplateRendererService);
//# sourceMappingURL=template-renderer.service.js.map