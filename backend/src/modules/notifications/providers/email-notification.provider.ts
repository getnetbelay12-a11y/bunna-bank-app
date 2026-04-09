import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

import {
  ChannelNotificationPayload,
  ChannelNotificationProvider,
  ChannelNotificationResult,
} from '../channel-notification-provider.port';

@Injectable()
export class EmailNotificationProvider implements ChannelNotificationProvider {
  private readonly logger = new Logger(EmailNotificationProvider.name);
  private transport: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult> {
    const config = this.configService.getOrThrow<{
      provider: string;
      sender: string;
      smtpHost: string;
      smtpPort: number;
      smtpSecure: boolean;
      smtpUser: string;
      smtpPass: string;
    }>('notifications.email');

    if (config.provider === 'log') {
      const messageId = `log-${Date.now()}`;
      this.logger.log(
        `Email reminder queued in log mode recipient=${payload.recipient} subject="${payload.subject ?? 'Bunna Bank Notification'}" messageId=${messageId} attachments=${payload.attachments?.length ?? 0}`,
      );
      return {
        status: 'sent',
        recipient: payload.recipient,
        providerMessageId: messageId,
      };
    }

    if (config.provider !== 'smtp') {
      this.logger.warn(
        `Email provider misconfigured for recipient=${payload.recipient}. provider=${config.provider}`,
      );
      return {
        status: 'failed',
        recipient: payload.recipient,
        errorMessage:
          'Mail configuration missing. Set EMAIL_PROVIDER=smtp with valid SMTP settings, or use EMAIL_PROVIDER=log in local seeded mode.',
      };
    }

    if (!config.smtpHost || !config.smtpUser || !config.smtpPass || !config.sender) {
      this.logger.warn(
        `SMTP settings incomplete for recipient=${payload.recipient}. host=${Boolean(config.smtpHost)} user=${Boolean(config.smtpUser)} sender=${Boolean(config.sender)}`,
      );
      return {
        status: 'failed',
        recipient: payload.recipient,
        errorMessage:
          'Mail configuration missing. Set EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS, and EMAIL_SENDER.',
      };
    }

    try {
      const transport = this.getTransport(config);
      const logoAttachment = payload.attachments?.find((item) => item.cid);
      this.logger.log(
        `email delivery strategy=${logoAttachment ? 'cid' : 'inline_html'} recipient=${payload.recipient} cid=${logoAttachment?.cid ?? 'none'}`,
      );

      const info = await transport.sendMail({
        from: `Bunna Bank <${config.sender}>`,
        to: payload.recipient,
        subject: payload.subject ?? 'Bunna Bank Notification',
        text: payload.messageBody,
        html:
          payload.htmlBody ?? `<p>${this.escapeForHtml(payload.messageBody)}</p>`,
        attachments: payload.attachments?.map((item) => ({
          filename: item.filename,
          content: item.content,
          contentType: item.contentType,
          cid: item.cid,
        })),
      });

      this.logger.log(`Email sent recipient=${payload.recipient} messageId=${info.messageId}`);

      return {
        status: 'sent',
        providerMessageId: info.messageId,
        recipient: payload.recipient,
      };
    } catch (error) {
      const message = this.buildDeliveryErrorMessage(error);
      this.logger.error(
        `Email send failed for ${payload.recipient}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        status: 'failed',
        recipient: payload.recipient,
        errorMessage: message,
      };
    }
  }

  private getTransport(config: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPass: string;
  }) {
    if (this.transport) {
      return this.transport;
    }

    this.transport = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    return this.transport;
  }

  private escapeForHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildDeliveryErrorMessage(error: unknown) {
    if (!(error instanceof Error)) {
      return 'Unknown SMTP delivery failure.';
    }

    const nodeError = error as Error & { code?: string; response?: string };
    if (nodeError.code === 'EAUTH') {
      return 'SMTP authentication failed.';
    }

    if (nodeError.code === 'ECONNECTION' || nodeError.code === 'ETIMEDOUT') {
      return 'SMTP connection failed.';
    }

    if (nodeError.response) {
      return nodeError.response;
    }

    return nodeError.message;
  }
}
