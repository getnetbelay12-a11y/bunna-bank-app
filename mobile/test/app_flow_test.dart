import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/demo_bank_api.dart';
import 'package:bunna_bank_mobile/src/features/auth/presentation/login_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Widget wrapWithScope({
    required AppController controller,
    required Widget child,
  }) {
    return AppScope(
      controller: controller,
      child: MaterialApp(home: child),
    );
  }

  testWidgets('login screen authenticates a shareholder member',
      (tester) async {
    final controller = AppController(services: AppServices.demo());

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const LoginScreen(),
      ),
    );

    await tester.enterText(find.byType(TextField).first, '0911000001');
    await tester.ensureVisible(find.widgetWithText(ElevatedButton, 'Continue'));
    await tester.tap(find.widgetWithText(ElevatedButton, 'Continue'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, '1234');
    await tester.ensureVisible(find.widgetWithText(FilledButton, 'Sign In'));
    await tester.tap(find.widgetWithText(FilledButton, 'Sign In'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(controller.session, isNotNull);
    expect(controller.session!.canVote, isTrue);
    controller.dispose();
  });

  testWidgets('login screen authenticates a regular member', (tester) async {
    final controller = AppController(services: AppServices.demo());

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const LoginScreen(),
      ),
    );

    await tester.enterText(find.byType(TextField).first, '0911000002');
    await tester.ensureVisible(find.widgetWithText(ElevatedButton, 'Continue'));
    await tester.tap(find.widgetWithText(ElevatedButton, 'Continue'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, '1234');
    await tester.ensureVisible(find.widgetWithText(FilledButton, 'Sign In'));
    await tester.tap(find.widgetWithText(FilledButton, 'Sign In'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(controller.session, isNotNull);
    expect(controller.session!.canVote, isFalse);
    controller.dispose();
  });

  test('demo notification api returns seeded notifications', () async {
    final api = DemoNotificationApi();

    final notifications = await api.fetchMyNotifications();

    expect(notifications, hasLength(7));
    expect(notifications.first.title, 'Login Detected');
    expect(
      notifications.any((item) => item.title == 'Card Request Under Review'),
      isTrue,
    );
    expect(
      notifications.any((item) => item.title == 'Payment Dispute Needs Action'),
      isTrue,
    );
    expect(
      notifications.any((item) => item.title == 'QR Receipt Ready'),
      isTrue,
    );
    expect(notifications.last.title, 'QR Receipt Ready');
  });
}
