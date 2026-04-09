class PaymentActivitySummary {
  const PaymentActivitySummary({
    required this.memberId,
    required this.customerId,
    required this.memberName,
    required this.openCases,
    required this.totalReceipts,
    required this.qrPayments,
    required this.schoolPayments,
    required this.disputeReceipts,
    this.phone,
    this.branchName,
    this.latestActivityAt,
  });

  final String memberId;
  final String customerId;
  final String memberName;
  final String? phone;
  final String? branchName;
  final int openCases;
  final int totalReceipts;
  final int qrPayments;
  final int schoolPayments;
  final int disputeReceipts;
  final DateTime? latestActivityAt;
}
