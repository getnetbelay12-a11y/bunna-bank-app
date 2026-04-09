class SmartRecommendation {
  const SmartRecommendation({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.reason,
    required this.badge,
    required this.actionLabel,
    required this.actionRoute,
    required this.status,
    required this.score,
  });

  final String id;
  final String type;
  final String title;
  final String description;
  final String reason;
  final String badge;
  final String actionLabel;
  final String actionRoute;
  final String status;
  final double score;
}
