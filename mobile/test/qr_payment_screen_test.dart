import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/models/index.dart';
import 'package:bunna_bank_mobile/src/core/services/api_contracts.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/session_store.dart';
import 'package:bunna_bank_mobile/src/features/payments/presentation/payments_screen.dart';
import 'package:bunna_bank_mobile/src/features/payments/presentation/qr_payment_screen.dart';
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

  testWidgets('qr payment screen submits a merchant payment', (tester) async {
    final base = AppServices.demo();
    final services = AppServices(
      authApi: base.authApi,
      locationApi: base.locationApi,
      memberApi: base.memberApi,
      shareholderApi: base.shareholderApi,
      recommendationApi: base.recommendationApi,
      insightApi: base.insightApi,
      identityVerificationApi: base.identityVerificationApi,
      savingsApi: _TestSavingsApi(),
      schoolPaymentApi: _TestQrSchoolPaymentApi(),
      loanApi: base.loanApi,
      notificationApi: base.notificationApi,
      documentUploadApi: base.documentUploadApi,
      chatApi: base.chatApi,
      autopayApi: base.autopayApi,
      securityApi: base.securityApi,
      cardApi: base.cardApi,
      serviceRequestApi: base.serviceRequestApi,
      votingApi: base.votingApi,
      sessionStore: SessionStore(),
    );
    final controller = AppController(services: services);
    controller.setPreviewSession(
      const MemberSession(
        memberId: 'member_test_1',
        customerId: '0911000001',
        fullName: 'Test Member',
        phone: '0911000001',
        memberType: MemberType.member,
        branchName: 'Bahir Dar',
        membershipStatus: 'active',
        identityVerificationStatus: 'verified',
        featureFlags: MemberFeatureFlags.defaults(),
      ),
    );

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const QrPaymentScreen(),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    await tester.enterText(find.byType(TextFormField).at(1), 'ABa Cafe');
    await tester.enterText(find.byType(TextFormField).at(2), '275');
    await tester.tap(find.widgetWithText(FilledButton, 'Pay Merchant'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.textContaining('QR payment sent to ABa Cafe.'), findsOneWidget);
    expect(find.text('View QR receipts'), findsOneWidget);

    await tester.tap(find.text('View QR receipts'));
    await tester.pumpAndSettle();
    expect(find.text('Payment Receipts'), findsOneWidget);
    expect(find.text('QR Payments'), findsOneWidget);
    expect(find.text('ABa Cafe'), findsOneWidget);
    expect(find.text('Blue Nile Academy'), findsNothing);

    controller.dispose();
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('payments screen opens the transfer workspace', (tester) async {
    final controller = AppController(services: AppServices.demo());

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const PaymentsScreen(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Send Money'));
    await tester.pumpAndSettle();

    expect(find.text('Transfer'), findsWidgets);
    expect(find.text('Transfer to Bank Account'), findsOneWidget);

    controller.dispose();
  });
}

class _TestQrSchoolPaymentApi implements SchoolPaymentApi {
  @override
  Future<List<Map<String, dynamic>>> fetchMyLinkedStudents() async => const [];

  @override
  Future<SchoolPaymentResult> createSchoolPayment({
    required String accountId,
    required String studentId,
    required String schoolName,
    required double amount,
    required String channel,
    String? narration,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<QrPaymentResult> createQrPayment({
    required String accountId,
    required String qrPayload,
    required String merchantName,
    required double amount,
    String? narration,
  }) async {
    return QrPaymentResult(
      transactionId: 'qr_txn_1',
      transactionReference: 'QRP-DEMO-2026-001',
      notificationStatus: 'sent',
      merchantName: merchantName,
      amount: amount,
    );
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMySchoolPayments() async => const [];

  @override
  Future<PaymentActivitySummary?> fetchMyPaymentActivity() async => null;

  @override
  Future<List<PaymentReceiptItem>> fetchMyPaymentReceipts() async {
    return [
      PaymentReceiptItem(
        receiptId: 'receipt_qr_1',
        receiptType: 'qr_payment',
        sourceId: 'qr_txn_1',
        title: 'ABa Cafe',
        description: 'QR payment to ABa Cafe',
        status: 'successful',
        amount: 275,
        currency: 'ETB',
        transactionReference: 'QRP-DEMO-2026-001',
        counterparty: 'ABa Cafe',
        channel: 'mobile',
        attachments: const [],
        recordedAt: DateTime(2026, 3, 21, 7, 45),
        metadata: const {
          'qrPayload': 'merchant:aba-cafe',
        },
      ),
    ];
  }
}

class _TestSavingsApi implements SavingsApi {
  @override
  Future<List<SavingsAccount>> fetchMyAccounts(String memberId) async {
    return const [
      SavingsAccount(
        accountId: 'sav_test_1',
        accountNumber: '100012340001',
        balance: 5000,
        currency: 'ETB',
        isActive: true,
      ),
    ];
  }

  @override
  Future<List<AccountTransaction>> fetchAccountTransactions(
          String accountId) async =>
      const [];
}
