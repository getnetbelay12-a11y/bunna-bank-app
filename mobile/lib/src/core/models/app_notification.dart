class AppNotification {
  const AppNotification({
    required this.notificationId,
    required this.type,
    required this.channel,
    required this.status,
    required this.title,
    required this.message,
    required this.createdAt,
    this.entityType,
    this.entityId,
    this.actionLabel,
    this.priority,
    this.deepLink,
  });

  final String notificationId;
  final String type;
  final String channel;
  final String status;
  final String title;
  final String message;
  final DateTime createdAt;
  final String? entityType;
  final String? entityId;
  final String? actionLabel;
  final String? priority;
  final String? deepLink;
}
