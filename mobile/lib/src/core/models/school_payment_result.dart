class SchoolPaymentResult {
  const SchoolPaymentResult({
    required this.schoolPaymentId,
    required this.transactionReference,
    required this.notificationStatus,
  });

  final String schoolPaymentId;
  final String transactionReference;
  final String notificationStatus;
}
