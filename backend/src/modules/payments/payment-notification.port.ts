export interface PaymentNotificationPayload {
  userId: string;
  title: string;
  message: string;
}

export interface PaymentNotificationPort {
  dispatch(payload: PaymentNotificationPayload): Promise<'sent' | 'failed'>;
}

export const PAYMENT_NOTIFICATION_PORT = Symbol('PAYMENT_NOTIFICATION_PORT');
