export interface PaymentReceiptItem {
  receiptId: string;
  receiptType:
    | 'school_payment'
    | 'qr_payment'
    | 'payment_dispute'
    | 'failed_transfer';
  sourceId: string;
  title: string;
  description: string;
  status: string;
  amount?: number;
  currency?: string;
  transactionReference?: string;
  counterparty?: string;
  channel?: string;
  attachments: string[];
  recordedAt?: Date;
  metadata: Record<string, unknown>;
}
