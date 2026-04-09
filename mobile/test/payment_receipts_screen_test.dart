import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/models/index.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/api_contracts.dart';
import 'package:bunna_bank_mobile/src/core/services/session_store.dart';
import 'package:bunna_bank_mobile/src/features/payments/presentation/payments_screen.dart';
import 'package:bunna_bank_mobile/src/features/payments/presentation/payment_receipts_screen.dart';
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

  testWidgets(
      'payment receipts screen shows summary, confirmed payments, and dispute evidence',
      (tester) async {
    final base = AppServices.demo();
    final services = AppServices(
      authApi: base.authApi,
      locationApi: base.locationApi,
      memberApi: base.memberApi,
      shareholderApi: base.shareholderApi,
      recommendationApi: base.recommendationApi,
      insightApi: base.insightApi,
      identityVerificationApi: base.identityVerificationApi,
      savingsApi: base.savingsApi,
      schoolPaymentApi: _TestSchoolPaymentApi(),
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

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const PaymentReceiptsScreen(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Payment Receipts'), findsOneWidget);
    expect(find.text('Payment Activity Summary'), findsOneWidget);
    expect(find.text('Abebe Kebede'), findsOneWidget);
    expect(find.text('Customer ID: BUN-100001 · Bahir Dar Branch'),
        findsOneWidget);
    expect(find.text('Open Cases'), findsOneWidget);
    expect(find.text('Total Receipts'), findsOneWidget);
    expect(find.text('Confirmed Payments'), findsOneWidget);
    expect(find.text('Blue Nile Academy'), findsOneWidget);
    expect(find.text('ABa Cafe'), findsOneWidget);
    expect(find.text('ETB 1500'), findsOneWidget);
    expect(find.textContaining('QRP-DEMO-2026-001'), findsOneWidget);
    expect(find.text('Payment Issue Evidence'), findsOneWidget);
    expect(find.text('Payment dispute for SCH-2026-014'), findsOneWidget);
    expect(find.textContaining('Evidence: Awaiting receipt upload'),
        findsOneWidget);
    expect(
        find.textContaining('Evidence: transfer_receipt.png'), findsOneWidget);

    await tester.tap(find.text('QR'));
    await tester.pumpAndSettle();
    expect(find.text('QR Payments'), findsOneWidget);
    expect(find.text('ABa Cafe'), findsOneWidget);
    expect(find.text('Blue Nile Academy'), findsNothing);

    await tester.tap(find.text('Disputes'));
    await tester.pumpAndSettle();
    expect(find.text('ABa Cafe'), findsNothing);
    expect(find.text('Payment dispute for SCH-2026-014'), findsOneWidget);

    controller.dispose();
  });

  testWidgets('payments screen opens the receipts workspace', (tester) async {
    tester.view.physicalSize = const Size(800, 1400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    final controller = AppController(services: AppServices.demo());

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const PaymentsScreen(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.text('Payment Receipts'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    final receiptWorkspaceTrigger = find.byIcon(Icons.folder_outlined).last;
    await tester.ensureVisible(receiptWorkspaceTrigger);
    await tester.tap(receiptWorkspaceTrigger, warnIfMissed: false);
    await tester.pumpAndSettle();

    expect(find.text('Payment Receipts'), findsOneWidget);

    controller.dispose();
  });
}

class _TestSchoolPaymentApi implements SchoolPaymentApi {
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
  }) {
    throw UnimplementedError();
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMySchoolPayments() async {
    return [
      {
        'schoolName': 'Blue Nile Academy',
        'amount': 1500.0,
        'status': 'successful',
        'studentId': 'ST-1001',
        'channel': 'mobile',
        'createdAt': '2026-03-20T10:15:00.000Z',
      },
    ];
  }

  @override
  Future<PaymentActivitySummary?> fetchMyPaymentActivity() async {
    return PaymentActivitySummary(
      memberId: 'member_1',
      customerId: 'BUN-100001',
      memberName: 'Abebe Kebede',
      phone: '0911000001',
      branchName: 'Bahir Dar Branch',
      openCases: 2,
      totalReceipts: 4,
      qrPayments: 1,
      schoolPayments: 1,
      disputeReceipts: 2,
      latestActivityAt: DateTime(2026, 3, 22, 9, 10),
    );
  }

  @override
  Future<List<PaymentReceiptItem>> fetchMyPaymentReceipts() async {
    return [
      PaymentReceiptItem(
        receiptId: 'receipt_qr_1',
        receiptType: 'qr_payment',
        sourceId: 'qr_payment_1',
        title: 'ABa Cafe',
        description: 'QR payment to ABa Cafe',
        status: 'successful',
        amount: 275,
        currency: 'ETB',
        transactionReference: 'QRP-DEMO-2026-001',
        counterparty: 'ABa Cafe',
        channel: 'mobile',
        attachments: [],
        recordedAt: DateTime(2026, 3, 21, 7, 45),
        metadata: {
          'qrPayload': 'merchant:aba-cafe',
        },
      ),
      PaymentReceiptItem(
        receiptId: 'receipt_school_1',
        receiptType: 'school_payment',
        sourceId: 'school_payment_1',
        title: 'Blue Nile Academy',
        description: 'School payment for Blue Nile Academy.',
        status: 'successful',
        amount: 1500,
        currency: 'ETB',
        channel: 'mobile',
        attachments: [],
        recordedAt: DateTime(2026, 3, 20, 10, 15),
        metadata: {
          'studentId': 'ST-1001',
        },
      ),
      PaymentReceiptItem(
        receiptId: 'receipt_request_1',
        receiptType: 'failed_transfer',
        sourceId: 'request_receipt_1',
        title: 'Transfer issue for TXN-2026-001',
        description: 'Operations is validating the transfer reference.',
        status: 'under_review',
        amount: 2400,
        currency: 'ETB',
        transactionReference: 'TXN-2026-001',
        counterparty: 'Dashen Bank',
        attachments: ['transfer_receipt.png'],
        recordedAt: DateTime(2026, 3, 21, 9, 30),
        metadata: {
          'occurredAt': '2026-03-21 09:10',
        },
      ),
      PaymentReceiptItem(
        receiptId: 'receipt_request_2',
        receiptType: 'payment_dispute',
        sourceId: 'request_receipt_2',
        title: 'Payment dispute for SCH-2026-014',
        description:
            'Please upload the payment receipt screenshot to continue the review.',
        status: 'awaiting_customer',
        amount: 3500,
        currency: 'ETB',
        transactionReference: 'SCH-2026-014',
        counterparty: 'Bahir Dar Academy',
        attachments: [],
        recordedAt: DateTime(2026, 3, 22, 9, 10),
        metadata: {
          'occurredAt': '2026-03-22 08:30',
        },
      ),
    ];
  }
}
