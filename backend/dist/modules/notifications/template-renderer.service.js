"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRendererService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const enums_1 = require("../../common/enums");
const notification_template_registry_1 = require("./notification-template.registry");
const BUNNA_BRAND_NAME = 'Bunna Bank';
const BUNNA_INSURANCE_NAME = 'Bunna Insurance';
const DEMO_CUSTOMER_NAME = 'Abebe Kebede';
const DEMO_PAYMENT_AMOUNT = '502,346.00';
const DEMO_DUE_DATE = 'March 17, 2026';
const DEMO_RENEWAL_DATE = 'March 19, 2026';
const DEMO_POLICY_NUMBER = 'CUST-1001-INS-001';
let TemplateRendererService = class TemplateRendererService {
    constructor() {
        this.logoCid = 'cid:bunna-bank-logo';
        this.repoRoot = (0, path_1.join)(__dirname, '..', '..', '..', '..');
        this.templateDir = (0, path_1.join)(this.repoRoot, 'templates', 'notifications');
        this.layoutTemplate = (0, fs_1.readFileSync)((0, path_1.join)(this.templateDir, '_layout.html'), 'utf8');
    }
    render(input) {
        const definition = (0, notification_template_registry_1.getNotificationTemplateDefinition)(input.templateType);
        if (!definition) {
            const fallbackBody = input.customMessageBody ?? `${BUNNA_BRAND_NAME} reminder`;
            return {
                subject: input.subject ?? `${BUNNA_BRAND_NAME} Notification`,
                emailHtml: this.wrapHtml(input.subject ?? `${BUNNA_BRAND_NAME} Notification`, `<p style="margin:0;font-size:16px;line-height:1.65;">${this.escapeHtml(fallbackBody)}</p>`, `<p style="margin:0;font-size:16px;line-height:1.65;">${this.escapeHtml(fallbackBody)}</p>`),
                emailText: fallbackBody,
                inAppTitle: input.subject ?? `${BUNNA_BRAND_NAME} Notification`,
                inAppMessage: fallbackBody,
                smsMessage: fallbackBody,
                telegramMessage: fallbackBody,
                logMessageBody: fallbackBody,
            };
        }
        const data = this.buildTemplateData(definition, input.member, input.useDemoContent ?? false);
        const englishContent = this.interpolate(this.readTemplate(definition.templateFile), data);
        const amharicContent = this.buildAmharicContent(definition, data);
        const subject = input.subject ?? definition.subject;
        const introMessage = input.customMessageBody?.trim();
        const emailHtml = this.wrapHtml(subject, introMessage ? this.prependInfoNote(introMessage, englishContent) : englishContent, introMessage ? this.prependInfoNote(this.translateCustomNote(introMessage), amharicContent) : amharicContent);
        return {
            subject,
            emailHtml,
            emailText: this.buildEmailText(definition, data, introMessage),
            inAppTitle: definition.title,
            inAppMessage: this.buildInAppMessage(definition, data),
            smsMessage: this.buildSmsMessage(definition, data),
            telegramMessage: this.buildTelegramMessage(definition, data),
            logMessageBody: introMessage ?? this.buildInAppMessage(definition, data),
        };
    }
    buildTemplateData(definition, member, useDemoContent) {
        const dueDate = useDemoContent
            ? DEMO_DUE_DATE
            : this.formatDate(this.daysFromNow(5));
        const renewalDate = useDemoContent
            ? DEMO_RENEWAL_DATE
            : this.formatDate(this.daysFromNow(7));
        return {
            customerName: useDemoContent
                ? DEMO_CUSTOMER_NAME
                : member.fullName || DEMO_CUSTOMER_NAME,
            paymentAmount: DEMO_PAYMENT_AMOUNT,
            dueDate,
            lateInterest: '0.00',
            lateDays: '0',
            paymentDate: this.formatDate(new Date()),
            provider: BUNNA_INSURANCE_NAME,
            policyNumber: useDemoContent
                ? DEMO_POLICY_NUMBER
                : `${member.customerId}-INS-001`,
            renewalDate,
            daysRemaining: definition.category === enums_1.NotificationCategory.INSURANCE ? '7' : '5',
        };
    }
    buildAmharicContent(definition, data) {
        switch (definition.templateType) {
            case enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">ክቡር/ክብርት ${this.escapeHtml(data.customerName)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">የኢንሹራንስ ፖሊሲዎ የማደስ ጊዜ በ<strong>${this.escapeHtml(data.daysRemaining)}</strong> ቀናት ውስጥ ይደርሳል።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid #e2d8d6;border-radius:16px;background:#faf7f6;">
              <div style="margin-bottom:10px;font-size:15px;"><strong>አቅራቢ:</strong> ${this.escapeHtml(data.provider)}</div>
              <div style="margin-bottom:10px;font-size:15px;"><strong>ፖሊሲ ቁጥር:</strong> ${this.escapeHtml(data.policyNumber)}</div>
              <div style="font-size:15px;"><strong>የማደስ ቀን:</strong> ${this.escapeHtml(data.renewalDate)}</div>
            </div>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.8;">ከአንድ በላይ ፖሊሲ ካሉዎት ሲልኩ <strong>policy:${this.escapeHtml(data.policyNumber)}</strong> ብለው በርዕስ ወይም በመግለጫ ውስጥ ያስገቡ።</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.8;">እባክዎ የማደስ ሰነድዎን ፎቶ/PDF በቴሌግራም ይላኩ ወይም በአባሪ ፋይል ለዚህ ኢሜይል ይመልሱ።</p>
            <p style="margin:0;font-size:15px;line-height:1.8;">እናመሰግናለን፣<br />የአገልግሎት እና ግንኙነት ቡድን<br />ቡና ባንክ</p>
          </section>
        `;
            case enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">ክቡር/ክብርት ${this.escapeHtml(data.customerName)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">ክፍያዎ በተሳካ ሁኔታ ተቀብሏል።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid #e2d8d6;border-radius:16px;background:#faf7f6;">
              <div style="margin-bottom:10px;font-size:15px;"><strong>የዘገየ ክፍያ ወለድ (${this.escapeHtml(data.lateDays)} ቀናት):</strong> ETB ${this.escapeHtml(data.lateInterest)}</div>
              <div style="margin-bottom:10px;font-size:15px;"><strong>የክፍያ መጠን:</strong> ETB ${this.escapeHtml(data.paymentAmount)}</div>
              <div style="font-size:15px;"><strong>የክፍያ ቀን:</strong> ${this.escapeHtml(data.paymentDate)}</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;">እናመሰግናለን፣<br />የአገልግሎት እና ግንኙነት ቡድን<br />ቡና ባንክ</p>
          </section>
        `;
            case enums_1.NotificationTemplateType.LOAN_DUE_SOON:
            case enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER:
            default:
                return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">ሰላም ${this.escapeHtml(data.customerName)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">የብድር ክፍያዎ ዝርዝር ከታች ቀርቧል።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid #e2d8d6;border-radius:16px;background:#faf7f6;">
              <div style="margin-bottom:10px;font-size:15px;"><strong>የክፍያ መጠን:</strong> ETB ${this.escapeHtml(data.paymentAmount)}</div>
              <div style="font-size:15px;"><strong>የክፍያ ቀን:</strong> ${this.escapeHtml(data.dueDate)}</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;">እናመሰግናለን፣<br />የአገልግሎት እና ግንኙነት ቡድን<br />ቡና ባንክ</p>
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
            case enums_1.NotificationTemplateType.LOAN_DUE_SOON:
            case enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER:
            default:
                return `Your loan payment of ETB ${data.paymentAmount} is due on ${data.dueDate}.`;
        }
    }
    buildSmsMessage(definition, data) {
        switch (definition.templateType) {
            case enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
                return `${BUNNA_BRAND_NAME}: Your insurance policy ${data.policyNumber} is due for renewal on ${data.renewalDate}.`;
            case enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION:
                return `${BUNNA_BRAND_NAME}: We received your ETB ${data.paymentAmount} payment on ${data.paymentDate}.`;
            case enums_1.NotificationTemplateType.LOAN_DUE_SOON:
            case enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER:
            default:
                return `${BUNNA_BRAND_NAME}: Your loan payment of ETB ${data.paymentAmount} is due on ${data.dueDate}.`;
        }
    }
    buildTelegramMessage(definition, data) {
        switch (definition.templateType) {
            case enums_1.NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
                return `Insurance Renewal Reminder\nCustomer: ${data.customerName}\nProvider: ${data.provider}\nPolicy Number: ${data.policyNumber}\nRenewal Due Date: ${data.renewalDate}`;
            case enums_1.NotificationTemplateType.PAYMENT_CONFIRMATION:
                return `Payment Confirmation\nCustomer: ${data.customerName}\nPayment Amount: ETB ${data.paymentAmount}\nPayment Date: ${data.paymentDate}`;
            case enums_1.NotificationTemplateType.LOAN_DUE_SOON:
            case enums_1.NotificationTemplateType.LOAN_PAYMENT_REMINDER:
            default:
                return `Loan Payment Reminder\nCustomer: ${data.customerName}\nPayment Amount: ETB ${data.paymentAmount}\nDue Date: ${data.dueDate}`;
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
            default:
                lines.push('', `Hello ${data.customerName},`, 'Your Bunna Bank loan payment details are below:', `Payment Amount: ETB ${data.paymentAmount}`, `Due Date: ${data.dueDate}`);
        }
        return lines.join('\n');
    }
    prependInfoNote(note, content) {
        return `<div style="margin:0 0 18px;padding:14px 16px;border-radius:14px;background:#f8f1f0;border:1px solid #e2d8d6;color:#243746;font-size:15px;line-height:1.65;">${this.escapeHtml(note)}</div>${content}`;
    }
    wrapHtml(title, englishContent, amharicContent) {
        return this.interpolate(this.layoutTemplate, {
            title,
            logoUrl: this.logoCid,
            englishContent,
            amharicContent,
        }, ['englishContent', 'amharicContent']);
    }
    translateCustomNote(note) {
        return `ማስታወሻ: ${note}`;
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
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
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
};
exports.TemplateRendererService = TemplateRendererService;
exports.TemplateRendererService = TemplateRendererService = __decorate([
    (0, common_1.Injectable)()
], TemplateRendererService);
//# sourceMappingURL=template-renderer.service.js.map