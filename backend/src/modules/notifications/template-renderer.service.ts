import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  NotificationCategory,
  NotificationTemplateType,
} from '../../common/enums';
import { MemberDocument } from '../members/schemas/member.schema';
import {
  getNotificationTemplateDefinition,
  type NotificationTemplateDefinition,
} from './notification-template.registry';

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

type TemplateData = Record<string, string>;

const BUNNA_BRAND_NAME = 'Bunna Bank';
const BUNNA_INSURANCE_NAME = 'Bunna Insurance';
const DEMO_CUSTOMER_NAME = 'Abebe Kebede';
const DEMO_PAYMENT_AMOUNT = '502,346.00';
const DEMO_DUE_DATE = 'March 17, 2026';
const DEMO_RENEWAL_DATE = 'March 19, 2026';
const DEMO_POLICY_NUMBER = 'CUST-1001-INS-001';

@Injectable()
export class TemplateRendererService {
  private readonly logoCid = 'cid:bunna-bank-logo';
  private readonly repoRoot = join(__dirname, '..', '..', '..', '..');
  private readonly templateDir = join(
    this.repoRoot,
    'templates',
    'notifications',
  );
  private readonly layoutTemplate = readFileSync(
    join(this.templateDir, '_layout.html'),
    'utf8',
  );

  render(input: TemplateRenderInput): RenderedNotificationContent {
    const definition = getNotificationTemplateDefinition(input.templateType);
    if (!definition) {
      const fallbackBody = input.customMessageBody ?? `${BUNNA_BRAND_NAME} reminder`;

      return {
        subject: input.subject ?? `${BUNNA_BRAND_NAME} Notification`,
        emailHtml: this.wrapHtml(
          input.subject ?? `${BUNNA_BRAND_NAME} Notification`,
          `<p style="margin:0;font-size:16px;line-height:1.65;">${this.escapeHtml(
            fallbackBody,
          )}</p>`,
          `<p style="margin:0;font-size:16px;line-height:1.65;">${this.escapeHtml(
            fallbackBody,
          )}</p>`,
        ),
        emailText: fallbackBody,
        inAppTitle: input.subject ?? `${BUNNA_BRAND_NAME} Notification`,
        inAppMessage: fallbackBody,
        smsMessage: fallbackBody,
        telegramMessage: fallbackBody,
        logMessageBody: fallbackBody,
      };
    }

    const data = this.buildTemplateData(
      definition,
      input.member,
      input.useDemoContent ?? false,
    );
    const englishContent = this.interpolate(
      this.readTemplate(definition.templateFile),
      data,
    );
    const amharicContent = this.buildAmharicContent(definition, data);
    const subject = input.subject ?? definition.subject;
    const introMessage = input.customMessageBody?.trim();
    const emailHtml = this.wrapHtml(
      subject,
      introMessage ? this.prependInfoNote(introMessage, englishContent) : englishContent,
      introMessage ? this.prependInfoNote(this.translateCustomNote(introMessage), amharicContent) : amharicContent,
    );

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

  private buildTemplateData(
    definition: NotificationTemplateDefinition,
    member: MemberDocument,
    useDemoContent: boolean,
  ): TemplateData {
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
      daysRemaining:
        definition.category === NotificationCategory.INSURANCE ? '7' : '5',
    };
  }

  private buildAmharicContent(
    definition: NotificationTemplateDefinition,
    data: TemplateData,
  ): string {
    switch (definition.templateType) {
      case NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
        return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">ክቡር/ክብርት ${this.escapeHtml(data.customerName)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">የኢንሹራንስ ፖሊሲዎ የማደስ ጊዜ በ<strong>${this.escapeHtml(
              data.daysRemaining,
            )}</strong> ቀናት ውስጥ ይደርሳል።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid #e2d8d6;border-radius:16px;background:#faf7f6;">
              <div style="margin-bottom:10px;font-size:15px;"><strong>አቅራቢ:</strong> ${this.escapeHtml(
                data.provider,
              )}</div>
              <div style="margin-bottom:10px;font-size:15px;"><strong>ፖሊሲ ቁጥር:</strong> ${this.escapeHtml(
                data.policyNumber,
              )}</div>
              <div style="font-size:15px;"><strong>የማደስ ቀን:</strong> ${this.escapeHtml(
                data.renewalDate,
              )}</div>
            </div>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.8;">ከአንድ በላይ ፖሊሲ ካሉዎት ሲልኩ <strong>policy:${this.escapeHtml(
              data.policyNumber,
            )}</strong> ብለው በርዕስ ወይም በመግለጫ ውስጥ ያስገቡ።</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.8;">እባክዎ የማደስ ሰነድዎን ፎቶ/PDF በቴሌግራም ይላኩ ወይም በአባሪ ፋይል ለዚህ ኢሜይል ይመልሱ።</p>
            <p style="margin:0;font-size:15px;line-height:1.8;">እናመሰግናለን፣<br />የአገልግሎት እና ግንኙነት ቡድን<br />ቡና ባንክ</p>
          </section>
        `;
      case NotificationTemplateType.PAYMENT_CONFIRMATION:
        return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">ክቡር/ክብርት ${this.escapeHtml(data.customerName)},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">ክፍያዎ በተሳካ ሁኔታ ተቀብሏል።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid #e2d8d6;border-radius:16px;background:#faf7f6;">
              <div style="margin-bottom:10px;font-size:15px;"><strong>የዘገየ ክፍያ ወለድ (${this.escapeHtml(
                data.lateDays,
              )} ቀናት):</strong> ETB ${this.escapeHtml(data.lateInterest)}</div>
              <div style="margin-bottom:10px;font-size:15px;"><strong>የክፍያ መጠን:</strong> ETB ${this.escapeHtml(
                data.paymentAmount,
              )}</div>
              <div style="font-size:15px;"><strong>የክፍያ ቀን:</strong> ${this.escapeHtml(
                data.paymentDate,
              )}</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;">እናመሰግናለን፣<br />የአገልግሎት እና ግንኙነት ቡድን<br />ቡና ባንክ</p>
          </section>
        `;
      case NotificationTemplateType.LOAN_DUE_SOON:
      case NotificationTemplateType.LOAN_PAYMENT_REMINDER:
      default:
        return `
          <section>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">ሰላም ${this.escapeHtml(
              data.customerName,
            )},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">የብድር ክፍያዎ ዝርዝር ከታች ቀርቧል።</p>
            <div style="margin:0 0 20px;padding:18px;border:1px solid #e2d8d6;border-radius:16px;background:#faf7f6;">
              <div style="margin-bottom:10px;font-size:15px;"><strong>የክፍያ መጠን:</strong> ETB ${this.escapeHtml(
                data.paymentAmount,
              )}</div>
              <div style="font-size:15px;"><strong>የክፍያ ቀን:</strong> ${this.escapeHtml(
                data.dueDate,
              )}</div>
            </div>
            <p style="margin:0;font-size:15px;line-height:1.8;">እናመሰግናለን፣<br />የአገልግሎት እና ግንኙነት ቡድን<br />ቡና ባንክ</p>
          </section>
        `;
    }
  }

  private buildInAppMessage(
    definition: NotificationTemplateDefinition,
    data: TemplateData,
  ) {
    switch (definition.templateType) {
      case NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
        return `Your insurance policy ${data.policyNumber} expires in ${data.daysRemaining} days.`;
      case NotificationTemplateType.PAYMENT_CONFIRMATION:
        return `We received your ETB ${data.paymentAmount} payment on ${data.paymentDate}.`;
      case NotificationTemplateType.LOAN_DUE_SOON:
      case NotificationTemplateType.LOAN_PAYMENT_REMINDER:
      default:
        return `Your loan payment of ETB ${data.paymentAmount} is due on ${data.dueDate}.`;
    }
  }

  private buildSmsMessage(
    definition: NotificationTemplateDefinition,
    data: TemplateData,
  ) {
    switch (definition.templateType) {
      case NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
        return `${BUNNA_BRAND_NAME}: Your insurance policy ${data.policyNumber} is due for renewal on ${data.renewalDate}.`;
      case NotificationTemplateType.PAYMENT_CONFIRMATION:
        return `${BUNNA_BRAND_NAME}: We received your ETB ${data.paymentAmount} payment on ${data.paymentDate}.`;
      case NotificationTemplateType.LOAN_DUE_SOON:
      case NotificationTemplateType.LOAN_PAYMENT_REMINDER:
      default:
        return `${BUNNA_BRAND_NAME}: Your loan payment of ETB ${data.paymentAmount} is due on ${data.dueDate}.`;
    }
  }

  private buildTelegramMessage(
    definition: NotificationTemplateDefinition,
    data: TemplateData,
  ) {
    switch (definition.templateType) {
      case NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
        return `Insurance Renewal Reminder\nCustomer: ${data.customerName}\nProvider: ${data.provider}\nPolicy Number: ${data.policyNumber}\nRenewal Due Date: ${data.renewalDate}`;
      case NotificationTemplateType.PAYMENT_CONFIRMATION:
        return `Payment Confirmation\nCustomer: ${data.customerName}\nPayment Amount: ETB ${data.paymentAmount}\nPayment Date: ${data.paymentDate}`;
      case NotificationTemplateType.LOAN_DUE_SOON:
      case NotificationTemplateType.LOAN_PAYMENT_REMINDER:
      default:
        return `Loan Payment Reminder\nCustomer: ${data.customerName}\nPayment Amount: ETB ${data.paymentAmount}\nDue Date: ${data.dueDate}`;
    }
  }

  private buildEmailText(
    definition: NotificationTemplateDefinition,
    data: TemplateData,
    introMessage?: string,
  ) {
    const lines = [definition.subject];
    if (introMessage) {
      lines.push('', introMessage);
    }

    switch (definition.templateType) {
      case NotificationTemplateType.INSURANCE_RENEWAL_REMINDER:
        lines.push(
          '',
          `Dear ${data.customerName},`,
          `Your insurance policy renewal is due in ${data.daysRemaining} days.`,
          `Provider: ${data.provider}`,
          `Policy Number: ${data.policyNumber}`,
          `Renewal Due Date: ${data.renewalDate}`,
        );
        break;
      case NotificationTemplateType.PAYMENT_CONFIRMATION:
        lines.push(
          '',
          `Dear ${data.customerName},`,
          'We have successfully received your payment.',
          `Late Payment Interest (${data.lateDays} days overdue): ETB ${data.lateInterest}`,
          `Payment Amount: ETB ${data.paymentAmount}`,
          `Payment Date: ${data.paymentDate}`,
        );
        break;
      default:
        lines.push(
          '',
          `Hello ${data.customerName},`,
          'Your Bunna Bank loan payment details are below:',
          `Payment Amount: ETB ${data.paymentAmount}`,
          `Due Date: ${data.dueDate}`,
        );
    }

    return lines.join('\n');
  }

  private prependInfoNote(note: string, content: string) {
    return `<div style="margin:0 0 18px;padding:14px 16px;border-radius:14px;background:#f8f1f0;border:1px solid #e2d8d6;color:#243746;font-size:15px;line-height:1.65;">${this.escapeHtml(
      note,
    )}</div>${content}`;
  }

  private wrapHtml(title: string, englishContent: string, amharicContent: string) {
    return this.interpolate(this.layoutTemplate, {
      title,
      logoUrl: this.logoCid,
      englishContent,
      amharicContent,
    }, ['englishContent', 'amharicContent']);
  }

  private translateCustomNote(note: string) {
    return `ማስታወሻ: ${note}`;
  }

  private readTemplate(fileName: string) {
    return readFileSync(join(this.templateDir, fileName), 'utf8');
  }

  private interpolate(template: string, data: TemplateData, rawKeys: string[] = []) {
    return template.replace(/{{\s*([\w]+)\s*}}/g, (_match, key: string) =>
      data[key] !== undefined
        ? rawKeys.includes(key)
          ? data[key]
          : this.escapeHtml(data[key])
        : '',
    );
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  private daysFromNow(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
