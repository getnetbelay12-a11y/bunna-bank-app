class PaymentReceiptItem {
  const PaymentReceiptItem({
    required this.receiptId,
    required this.receiptType,
    required this.sourceId,
    required this.title,
    required this.description,
    required this.status,
    required this.attachments,
    this.amount,
    this.currency,
    this.transactionReference,
    this.counterparty,
    this.channel,
    this.recordedAt,
    this.metadata = const {},
  });

  final String receiptId;
  final String receiptType;
  final String sourceId;
  final String title;
  final String description;
  final String status;
  final double? amount;
  final String? currency;
  final String? transactionReference;
  final String? counterparty;
  final String? channel;
  final List<String> attachments;
  final DateTime? recordedAt;
  final Map<String, dynamic> metadata;
}
