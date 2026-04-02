import { Injectable } from '@nestjs/common';

import {
  PaymentNotificationPayload,
  PaymentNotificationPort,
} from './payment-notification.port';

@Injectable()
export class PaymentNotificationService implements PaymentNotificationPort {
  async dispatch(
    _payload: PaymentNotificationPayload,
  ): Promise<'sent' | 'failed'> {
    return 'sent';
  }
}
