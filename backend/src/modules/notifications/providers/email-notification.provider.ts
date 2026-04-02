import { Injectable, Logger } from '@nestjs/common';
import { existsSync } from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';

import {
  ChannelNotificationPayload,
  ChannelNotificationProvider,
  ChannelNotificationResult,
} from '../channel-notification-provider.port';

@Injectable()
export class EmailNotificationProvider implements ChannelNotificationProvider {
  private readonly logger = new Logger(EmailNotificationProvider.name);
  private readonly logoCid = 'bunna-bank-logo';
  private readonly logoPath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    'assets',
    'bunna_bank_logo.png',
  );
  private readonly provider =
    process.env.EMAIL_PROVIDER ?? (process.env.MAIL_HOST ? 'smtp' : 'log');
  private readonly host = process.env.MAIL_HOST ?? process.env.EMAIL_SMTP_HOST;
  private readonly port = Number(
    process.env.MAIL_PORT ?? process.env.EMAIL_SMTP_PORT ?? 587,
  );
  private readonly user = process.env.MAIL_USER ?? process.env.EMAIL_SMTP_USER;
  private readonly password =
    process.env.MAIL_PASSWORD ?? process.env.EMAIL_SMTP_PASS;
  private readonly from =
    process.env.MAIL_FROM ??
    process.env.EMAIL_SENDER ??
    'notifications@bunna-bank.local';
  private readonly secure =
    (process.env.MAIL_SECURE ?? process.env.EMAIL_SMTP_SECURE ?? 'false') === 'true';

  async send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult> {
    if (this.provider !== 'smtp') {
      return {
        status: 'failed',
        recipient: payload.recipient,
        errorMessage:
          'SMTP delivery is not configured. Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, and MAIL_FROM.',
      };
    }

    if (!this.host || !this.user || !this.password || !this.from) {
      return {
        status: 'failed',
        recipient: payload.recipient,
        errorMessage:
          'SMTP is not configured. Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, and MAIL_FROM.',
      };
    }

    try {
      const transport = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.user,
          pass: this.password,
        },
      });

      const info = await transport.sendMail({
        from: `Bunna Bank <${this.from}>`,
        to: payload.recipient,
        subject: payload.subject ?? 'Bunna Bank Notification',
        text: payload.messageBody,
        html:
          payload.htmlBody ?? `<p>${this.escapeForHtml(payload.messageBody)}</p>`,
        attachments: this.buildAttachments(),
      });

      this.logger.log(`Email sent recipient=${payload.recipient} messageId=${info.messageId}`);

      return {
        status: 'sent',
        providerMessageId: info.messageId,
        recipient: payload.recipient,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown SMTP delivery failure.';
      this.logger.error(`Email send failed for ${payload.recipient}: ${message}`);
      return {
        status: 'failed',
        recipient: payload.recipient,
        errorMessage: message,
      };
    }
  }

  private buildAttachments() {
    if (!existsSync(this.logoPath)) {
      this.logger.warn(`Email logo file not found at ${this.logoPath}`);
      return [];
    }

    return [
      {
        filename: 'bunna-bank-logo.png',
        path: this.logoPath,
        cid: this.logoCid,
      },
    ];
  }

  private escapeForHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
