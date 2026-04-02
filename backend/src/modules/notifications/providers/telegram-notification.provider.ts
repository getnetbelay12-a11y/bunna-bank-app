import { Injectable, Logger } from '@nestjs/common';

import {
  ChannelNotificationPayload,
  ChannelNotificationProvider,
  ChannelNotificationResult,
} from '../channel-notification-provider.port';

@Injectable()
export class TelegramNotificationProvider implements ChannelNotificationProvider {
  private readonly logger = new Logger(TelegramNotificationProvider.name);

  async send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult> {
    this.logger.warn(
      `Telegram delivery is not configured for ${payload.recipient}.`,
    );
    return {
      status: 'failed',
      recipient: payload.recipient,
      errorMessage:
        'Telegram delivery is not implemented in this repo yet.',
    };
  }
}
