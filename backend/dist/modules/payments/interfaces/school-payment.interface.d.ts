export interface SchoolPaymentResult {
    schoolPaymentId: string;
    transactionId: string;
    transactionReference: string;
    notificationStatus: 'sent' | 'failed';
}
export interface SchoolPaymentSummary {
    totalPayments: number;
    totalAmount: number;
    mobilePayments: number;
    branchPayments: number;
}
