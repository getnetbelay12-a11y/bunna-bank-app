class QrPaymentResult {
  const QrPaymentResult({
    required this.transactionId,
    required this.transactionReference,
    required this.notificationStatus,
    required this.merchantName,
    required this.amount,
  });

  final String transactionId;
  final String transactionReference;
  final String notificationStatus;
  final String merchantName;
  final double amount;
}
