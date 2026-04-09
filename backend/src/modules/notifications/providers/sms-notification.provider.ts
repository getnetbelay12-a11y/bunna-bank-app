import { Injectable, Logger } from '@nestjs/common';

import {
  ChannelNotificationPayload,
  ChannelNotificationProvider,
  ChannelNotificationResult,
} from '../channel-notification-provider.port';

@Injectable()
export class SmsNotificationProvider implements ChannelNotificationProvider {
  private readonly logger = new Logger(SmsNotificationProvider.name);

  async send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult> {
    this.logger.log(`SMS reminder queued for ${payload.recipient}.`);
    return {
      status: 'sent',
      providerMessageId: `sms-${Date.now()}`,
      recipient: payload.recipient,
    };
  }
}
