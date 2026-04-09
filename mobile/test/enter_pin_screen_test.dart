import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/features/auth/presentation/enter_pin_screen.dart';
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

  testWidgets('enter pin screen shows auth error for invalid pin', (
    tester,
  ) async {
    final controller = AppController(services: AppServices.demo());

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const EnterPinScreen(
          challengeId: 'demo_0911000001_mobile-device-1',
          identifier: '0911000001',
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField), '0000');
    await tester.tap(find.widgetWithText(FilledButton, 'Sign In'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));

    expect(find.textContaining('Invalid PIN'), findsWidgets);
    expect(controller.session, isNull);

    controller.dispose();
  });
}
