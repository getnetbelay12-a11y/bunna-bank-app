export interface QrPaymentResult {
  transactionId: string;
  transactionReference: string;
  notificationStatus: 'sent' | 'failed';
  merchantName: string;
  amount: number;
}
