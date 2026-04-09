import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/features/school_payments/presentation/school_payment_screen.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Widget wrapWithScope({
    required AppController controller,
    required Widget child,
  }) {
    return AppScope(
      controller: controller,
      child: MaterialApp(home: child),
    );
  }

  testWidgets('linked student created in backend appears in school payment screen', (
    tester,
  ) async {
    final services = AppServices.create();
    final controller = AppController(services: services);

    final challenge = await controller.startLogin(identifier: '0911000001');
    await controller.verifyPin(
      challengeId: challenge.challengeId,
      pin: '1234',
    );

    final linkedStudents = await services.schoolPaymentApi.fetchMyLinkedStudents();
    expect(linkedStudents, isNotEmpty);
    final expectedStudent = linkedStudents.first;
    final expectedName = expectedStudent['fullName'] as String? ?? '';
    final expectedSchool = expectedStudent['schoolName'] as String? ?? '';
    final expectedParentUpdate =
        expectedStudent['parentUpdateSummary'] as String? ?? '';

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const SchoolPaymentScreen(),
      ),
    );
    await tester.pumpAndSettle(const Duration(seconds: 2));

    expect(find.byType(SchoolPaymentScreen), findsOneWidget);
    expect(find.text(expectedName), findsWidgets);
    expect(find.textContaining(expectedSchool), findsWidgets);
    expect(find.textContaining(expectedParentUpdate), findsWidgets);

    controller.dispose();
  });
}
