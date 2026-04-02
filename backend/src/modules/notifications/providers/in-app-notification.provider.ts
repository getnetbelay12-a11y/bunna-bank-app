import { Injectable } from '@nestjs/common';

import {
  ChannelNotificationPayload,
  ChannelNotificationProvider,
  ChannelNotificationResult,
} from '../channel-notification-provider.port';

@Injectable()
export class InAppNotificationProvider implements ChannelNotificationProvider {
  async send(payload: ChannelNotificationPayload): Promise<ChannelNotificationResult> {
    return {
      status: 'delivered',
      providerMessageId: `in-app-${Date.now()}`,
      recipient: payload.recipient,
    };
  }
}
