class CardItem {
  const CardItem({
    required this.id,
    required this.cardType,
    required this.status,
    required this.channelControls,
    this.last4,
    this.preferredBranch,
    this.issuedAt,
    this.lockedAt,
  });

  final String id;
  final String cardType;
  final String status;
  final Map<String, dynamic> channelControls;
  final String? last4;
  final String? preferredBranch;
  final DateTime? issuedAt;
  final DateTime? lockedAt;
}

class CardRequestResult {
  const CardRequestResult({
    required this.id,
    required this.requestType,
    required this.status,
    this.cardId,
  });

  final String id;
  final String requestType;
  final String status;
  final String? cardId;
}
