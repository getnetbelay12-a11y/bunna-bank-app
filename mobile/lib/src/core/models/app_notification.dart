class AppNotification {
  const AppNotification({
    required this.notificationId,
    required this.type,
    required this.status,
    required this.title,
    required this.message,
    required this.createdAt,
  });

  final String notificationId;
  final String type;
  final String status;
  final String title;
  final String message;
  final DateTime createdAt;
}
