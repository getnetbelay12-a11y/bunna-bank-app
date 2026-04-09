import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:bunna_bank_mobile/src/app/app.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/features/auth/presentation/login_screen.dart';
import 'package:bunna_bank_mobile/src/features/profile/presentation/profile_screen.dart';
import 'package:bunna_bank_mobile/src/features/splash/presentation/splash_screen.dart';
import 'package:bunna_bank_mobile/widgets/bunna_bank_logo_compat.dart';
import 'package:bunna_bank_mobile/widgets/bunna_bank_mark.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('shareholder login flow shows branded home and profile screens', (
    tester,
  ) async {
    await tester.pumpWidget(BunnaBankApp(services: AppServices.demo()));

    expect(find.byType(SplashScreen), findsOneWidget);
    expect(find.byType(BunnaBankMark), findsOneWidget);
    expect(find.byType(BunnaBankLogo), findsOneWidget);
    expect(find.text('Bunna Bank'), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 1300));
    await tester.pumpAndSettle();

    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.byType(BunnaBankLogo), findsOneWidget);
    expect(
      find.text('Simple secure access for membership services'),
      findsOneWidget,
    );

    await tester.enterText(find.byType(TextFormField).at(0), '0911000001');
    await tester.tap(find.widgetWithText(ElevatedButton, 'Continue'));
    await tester.pump();
    await tester.pumpAndSettle(const Duration(seconds: 2));

    expect(find.text('Enter PIN'), findsOneWidget);
    expect(find.text('Secure sign in'), findsOneWidget);

    await tester.enterText(find.byType(TextFormField).at(0), '1234');
    await tester.tap(find.widgetWithText(FilledButton, 'Sign In'));
    await tester.pump();
    await tester.pumpAndSettle(const Duration(seconds: 2));

    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsWidgets);
    expect(find.text('Transfer'), findsWidgets);
    expect(find.text('Telebirr'), findsWidgets);
    expect(find.text('Telecom'), findsWidgets);
    expect(find.text('Support'), findsWidgets);

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.byType(ProfileScreen), findsOneWidget);
    expect(find.text('Profile'), findsWidgets);
    expect(find.text('Abebe Kebede'), findsOneWidget);
    expect(find.text('Account summary'), findsOneWidget);
    expect(find.textContaining('Branch:'), findsOneWidget);
  });
}
