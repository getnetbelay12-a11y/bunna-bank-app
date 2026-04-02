import 'package:flutter_test/flutter_test.dart';

import 'package:cbe_bank_mobile/src/app/app.dart';

void main() {
  testWidgets('shows branded splash before the login screen', (tester) async {
    await tester.pumpWidget(const CbeBankApp());

    expect(find.text('CBE Bank'), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 1300));
    await tester.pumpAndSettle();

    expect(find.text('Phone Number / Customer ID'), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);
  });
}
