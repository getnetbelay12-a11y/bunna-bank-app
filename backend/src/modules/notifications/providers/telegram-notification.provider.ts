import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ChannelNotificationPayload,
  ChannelNotificationProvider,
  ChannelNotificationResult,
} from '../channel-notification-provider.port';

@Injectable()
export class TelegramNotificationProvider implements ChannelNotificationProvider {
  private readonly logger = new Logger(TelegramNotificationProvider.name);
  private readonly enabled: boolean;
  private readonly botToken: string;
  private readonly apiBase: string;
  private readonly forceTestChatId: string;

  constructor(private readonly configService: ConfigService) {
    this.enabled =
      this.configService.get<boolean>('notifications.telegram.enabled') === true;
    this.botToken =
      this.configService.get<string>('notifications.telegram.botToken') ?? '';
    this.apiBase =
      this.configService.get<string>('notifications.telegram.apiBase') ??
      'https://api.telegram.org';
    this.forceTestChatId =
      this.configService.get<string>('notifications.telegram.forceTestChatId') ?? '';

    this.logger.log(
      `Telegram config loaded tokenPresent=${this.botToken ? 'yes' : 'no'} apiBase=${this.apiBase} forceTestChatId=${this.forceTestChatId ? 'active' : 'inactive'}`,
    );
  }

  async send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult> {
    return this.sendTextMessage(payload.recipient, payload.messageBody);
  }

  async sendTextMessage(
    recipient: string,
    messageBody: string,
  ): Promise<ChannelNotificationResult> {
    const resolvedRecipient = recipient.trim();

    if (!this.enabled || !this.botToken) {
      this.logger.warn(
        `Telegram send skipped tokenPresent=${this.botToken ? 'yes' : 'no'} enabled=${this.enabled} recipient=${resolvedRecipient || 'unavailable'}`,
      );
      return {
        status: 'failed',
        recipient: resolvedRecipient || 'unavailable',
        errorMessage: 'Telegram bot token is missing.',
      };
    }

    if (!resolvedRecipient) {
      return {
        status: 'failed',
        recipient: 'unavailable',
        errorMessage: 'Telegram recipient chat ID not found.',
      };
    }

    const endpoint = `${this.apiBase.replace(/\/$/, '')}/bot${this.botToken}/sendMessage`;
    this.logger.log(
      `Telegram send starting recipient=${resolvedRecipient} apiBase=${this.apiBase} forceTestChatId=${this.forceTestChatId ? 'active' : 'inactive'}`,
    );

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: resolvedRecipient,
          text: messageBody,
          disable_web_page_preview: true,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; result?: { message_id?: number | string }; description?: string }
        | null;

      this.logger.log(
        `Telegram API response status=${response.status} recipient=${resolvedRecipient}`,
      );

      if (!response.ok || data?.ok === false) {
        return {
          status: 'failed',
          recipient: resolvedRecipient,
          errorMessage: data?.description || 'Telegram API request failed.',
        };
      }

      return {
        status: 'sent',
        providerMessageId:
          data?.result?.message_id != null ? String(data.result.message_id) : undefined,
        recipient: resolvedRecipient,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Telegram API request failed.';
      this.logger.error(
        `Telegram API request failed recipient=${resolvedRecipient}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        status: 'failed',
        recipient: resolvedRecipient,
        errorMessage: 'Telegram API request failed.',
      };
    }
  }
}
