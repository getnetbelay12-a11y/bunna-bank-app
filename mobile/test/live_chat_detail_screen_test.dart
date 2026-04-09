import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/features/chat/presentation/live_chat_detail_screen.dart';
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

  testWidgets('live chat detail screen sends a customer message', (
    tester,
  ) async {
    final controller = AppController(services: AppServices.demo());

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const LiveChatDetailScreen(conversationId: 'chat_demo_1'),
      ),
    );

    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField).last, 'Please help now');
    await tester.tap(find.widgetWithText(FilledButton, 'Send'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Please help now'), findsOneWidget);

    controller.dispose();
  });
}
