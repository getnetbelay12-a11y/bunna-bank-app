import '../../../core/models/app_notification.dart';

bool isShareholderNotification(AppNotification item) {
  final title = item.title.toLowerCase();
  final type = item.type.toLowerCase();
  final deepLink = (item.deepLink ?? '').toLowerCase();

  return type.contains('shareholder') ||
      type.contains('vote') ||
      title.contains('shareholder') ||
      title.contains('voting') ||
      deepLink.startsWith('/shareholder');
}

String notificationPreviewMessage(AppNotification item) {
  if (isShareholderNotification(item)) {
    return 'A shareholder voting event or governance update is available. Open to review the agenda, status, and participation details.';
  }

  return item.message;
}
