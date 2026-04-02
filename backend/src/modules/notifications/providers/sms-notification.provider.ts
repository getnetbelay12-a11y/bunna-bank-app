import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ChannelNotificationPayload,
  ChannelNotificationProvider,
  ChannelNotificationResult,
} from '../channel-notification-provider.port';

@Injectable()
export class SmsNotificationProvider implements ChannelNotificationProvider {
  private readonly logger = new Logger(SmsNotificationProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult> {
    const config = this.configService.getOrThrow<{
      sms: {
        enabled: boolean;
        provider: string;
        senderId: string;
        endpoint: string;
        apiKey: string;
      };
    }>('notifications');

    if (!config.sms.enabled) {
      return {
        status: 'failed',
        recipient: payload.recipient,
        errorMessage: 'SMS delivery is disabled.',
      };
    }

    if (config.sms.provider === 'generic_http') {
      if (!config.sms.endpoint) {
        return {
          status: 'failed',
          recipient: payload.recipient,
          errorMessage: 'SMS generic HTTP endpoint is not configured.',
        };
      }

      const response = await fetch(config.sms.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.sms.apiKey
            ? { Authorization: `Bearer ${config.sms.apiKey}` }
            : {}),
        },
        body: JSON.stringify({
          channel: 'sms',
          senderId: config.sms.senderId,
          recipient: payload.recipient,
          memberId: payload.memberId,
          category: payload.category,
          subject: payload.subject,
          messageBody: payload.messageBody,
        }),
      });

      if (!response.ok) {
        this.logger.warn(
          `SMS provider returned HTTP ${response.status} for ${payload.recipient}.`,
        );
        return {
          status: 'failed',
          recipient: payload.recipient,
          errorMessage: `SMS provider returned HTTP ${response.status}.`,
        };
      }

      return {
        status: 'sent',
        providerMessageId: `sms-${Date.now()}`,
        recipient: payload.recipient,
      };
    }

    return {
      status: 'failed',
      recipient: payload.recipient,
      errorMessage:
        'SMS log mode does not deliver real messages. Configure SMS_PROVIDER=generic_http for outbound delivery.',
    };
  }
}
