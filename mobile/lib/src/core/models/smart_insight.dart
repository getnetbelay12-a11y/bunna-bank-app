class SmartInsight {
  const SmartInsight({
    required this.id,
    required this.type,
    required this.priority,
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.actionRoute,
    this.dueAt,
    this.amount,
    this.currency,
    this.metadata = const {},
  });

  final String id;
  final String type;
  final String priority;
  final String title;
  final String message;
  final String actionLabel;
  final String actionRoute;
  final DateTime? dueAt;
  final double? amount;
  final String? currency;
  final Map<String, dynamic> metadata;
}

class SmartInsightFeed {
  const SmartInsightFeed({
    required this.generatedAt,
    required this.total,
    required this.urgentCount,
    required this.items,
  });

  final DateTime generatedAt;
  final int total;
  final int urgentCount;
  final List<SmartInsight> items;
}
