import { PaymentNotificationPayload, PaymentNotificationPort } from './payment-notification.port';
export declare class PaymentNotificationService implements PaymentNotificationPort {
    dispatch(_payload: PaymentNotificationPayload): Promise<'sent' | 'failed'>;
}
