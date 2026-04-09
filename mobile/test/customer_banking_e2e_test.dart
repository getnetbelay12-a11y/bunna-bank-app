import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/core/models/app_notification.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/demo_bank_api.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('customer banking demo flows', () {
    test('customer login creates a member session', () async {
      final controller = AppController(services: AppServices.demo());

      await controller.login(
        customerId: '0911000001',
        password: 'demo-pass',
      );

      expect(controller.session, isNotNull);
      expect(controller.session!.customerId, 'BUN-100001');
      expect(controller.session!.phone, '0911000001');
      controller.dispose();
    });

    test('school payment updates the customer payment history', () async {
      final api = DemoSchoolPaymentApi();

      final before = await api.fetchMySchoolPayments();

      final result = await api.createSchoolPayment(
        accountId: 'savings-1',
        studentId: 'ST-1001',
        schoolName: 'Bright Future School',
        amount: 5000,
        channel: 'mobile',
        narration: 'April school fee',
      );

      final after = await api.fetchMySchoolPayments();

      expect(result.transactionReference, isNotEmpty);
      expect(after.length, before.length + 1);
      expect(after.first['schoolName'], 'Bright Future School');
      expect(after.first['amount'], 5000);
    });

    test('notification reminders can be triggered and fetched in app', () async {
      final api = DemoNotificationApi();

      api.addNotification(
        AppNotification(
          notificationId: 'notif_school_due_test',
          type: 'school_payment_due',
          channel: 'mobile_push',
          status: 'sent',
          title: 'School fee due today',
          message: 'Bright Future School payment is due today.',
          createdAt: DateTime.now(),
          actionLabel: 'Pay now',
          priority: 'high',
          deepLink: '/payments/school',
        ),
      );

      final notifications = await api.fetchMyNotifications();

      expect(notifications.first.notificationId, 'notif_school_due_test');
      expect(notifications.first.deepLink, '/payments/school');
    });

    test('chat messages sent by customer are stored in backend-facing state', () async {
      final api = DemoChatApi();

      final created = await api.createConversation(
        issueCategory: 'general_help',
        initialMessage: 'I need help with my account.',
      );
      final before = await api.fetchConversation(created.id);

      final updated = await api.sendMessage(
        created.id,
        message: 'Please confirm my school payment status.',
      );

      expect(updated.messages.length, before.messages.length + 1);
      expect(updated.messages.last.message, 'Please confirm my school payment status.');
      expect(updated.latestMessage?.message, 'Please confirm my school payment status.');
    });
  });
}
