import 'package:bunna_bank_mobile/src/features/payments/presentation/transfer_menu_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('transfer to bank account follows the staged flow', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: TransferMenuScreen(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Transfer to Bank Account'));
    await tester.pumpAndSettle();

    expect(find.text('Saving - ETB - 7467'), findsWidgets);
    expect(find.text('Account No'), findsWidgets);

    await tester.enterText(find.byType(TextFormField).first, '1000350326794');
    await tester.tap(find.widgetWithText(FilledButton, 'Continue'));
    await tester.pumpAndSettle();

    expect(find.text('YOSEF AMDU BELAY'), findsOneWidget);

    await tester.tap(find.text('YOSEF AMDU BELAY'));
    await tester.pumpAndSettle();

    expect(find.text('YOSEF AMDU BELAY-ETB-6794'), findsOneWidget);

    await tester.tap(find.widgetWithText(FilledButton, 'Continue'));
    await tester.pumpAndSettle();

    expect(find.text('Payment Details'), findsWidgets);
    await tester.enterText(find.byType(TextFormField).at(0), '1235');
    await tester.enterText(find.byType(TextFormField).at(1), 'Reason');
    await tester.tap(find.widgetWithText(FilledButton, 'Continue'));
    await tester.pump();

    expect(find.textContaining('Transfer prepared for ETB 1235'), findsOneWidget);
  });
}
