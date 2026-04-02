class AccountTransaction {
  const AccountTransaction({
    required this.transactionReference,
    required this.type,
    required this.channel,
    required this.amount,
    required this.currency,
    required this.createdAt,
    this.narration,
  });

  final String transactionReference;
  final String type;
  final String channel;
  final double amount;
  final String currency;
  final DateTime createdAt;
  final String? narration;
}
