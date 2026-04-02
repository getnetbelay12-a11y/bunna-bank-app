import 'package:cbe_bank_mobile/src/core/models/index.dart';
import 'package:cbe_bank_mobile/src/core/services/api_contracts.dart';
import 'package:cbe_bank_mobile/src/core/services/app_services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('fallback notification api returns fallback data when primary fails', () async {
    final api = FallbackNotificationApi(
      primary: _FailingNotificationApi(),
      fallback: _SeedNotificationApi(),
    );

    final result = await api.fetchMyNotifications();

    expect(result, hasLength(1));
    expect(result.first.title, 'Fallback Notification');
  });
}

class _FailingNotificationApi implements NotificationApi {
  @override
  Future<List<AppNotification>> fetchMyNotifications() {
    throw Exception('network');
  }

  @override
  Future<AppNotification> markAsRead(String notificationId) {
    throw Exception('network');
  }
}

class _SeedNotificationApi implements NotificationApi {
  @override
  Future<List<AppNotification>> fetchMyNotifications() async {
    return [
      AppNotification(
        notificationId: 'notif_1',
        type: 'system',
        status: 'sent',
        title: 'Fallback Notification',
        message: 'Using fallback data',
        createdAt: DateTime(2026, 3, 9),
      ),
    ];
  }

  @override
  Future<AppNotification> markAsRead(String notificationId) async {
    return (await fetchMyNotifications()).first;
  }
}
