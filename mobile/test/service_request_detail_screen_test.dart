import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/models/index.dart';
import 'package:bunna_bank_mobile/src/core/services/api_contracts.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/session_store.dart';
import 'package:bunna_bank_mobile/src/features/service_requests/presentation/service_request_detail_screen.dart';
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

  testWidgets('service request detail shows payload facts and attachments', (tester) async {
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
      schoolPaymentApi: base.schoolPaymentApi,
      loanApi: base.loanApi,
      notificationApi: base.notificationApi,
      documentUploadApi: base.documentUploadApi,
      chatApi: base.chatApi,
      autopayApi: base.autopayApi,
      securityApi: base.securityApi,
      cardApi: base.cardApi,
      serviceRequestApi: _TestServiceRequestApi(),
      votingApi: base.votingApi,
      sessionStore: SessionStore(),
    );
    final controller = AppController(services: services);

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const ServiceRequestDetailScreen(requestId: 'svc_pay_1'),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Merchant charge dispute'), findsOneWidget);
    expect(find.text('Request details'), findsOneWidget);
    expect(find.text('Transaction reference'), findsOneWidget);
    expect(find.text('TXN-2026-001'), findsOneWidget);
    expect(find.text('ETB 12000'), findsOneWidget);
    expect(find.text('Dashen Bank'), findsOneWidget);
    expect(find.text('Attachments'), findsOneWidget);
    expect(find.text('receipt.png'), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, -400));
    await tester.pumpAndSettle();
    expect(find.text('Timeline'), findsOneWidget);

    controller.dispose();
  });

  testWidgets('service request detail shows phone update metadata', (tester) async {
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
      schoolPaymentApi: base.schoolPaymentApi,
      loanApi: base.loanApi,
      notificationApi: base.notificationApi,
      documentUploadApi: base.documentUploadApi,
      chatApi: base.chatApi,
      autopayApi: base.autopayApi,
      securityApi: base.securityApi,
      cardApi: base.cardApi,
      serviceRequestApi: _TestServiceRequestApi(),
      votingApi: base.votingApi,
      sessionStore: SessionStore(),
    );
    final controller = AppController(services: services);

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const ServiceRequestDetailScreen(requestId: 'svc_phone_1'),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Phone number update request'), findsOneWidget);
    expect(find.text('Request details'), findsOneWidget);
    expect(find.text('Requested phone number'), findsOneWidget);
    expect(find.text('0911000099'), findsOneWidget);
    expect(find.text('Attachments'), findsOneWidget);
    expect(find.text('selfie.jpg'), findsOneWidget);

    controller.dispose();
  });

  testWidgets('service request detail shows account relationship metadata', (tester) async {
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
      schoolPaymentApi: base.schoolPaymentApi,
      loanApi: base.loanApi,
      notificationApi: base.notificationApi,
      documentUploadApi: base.documentUploadApi,
      chatApi: base.chatApi,
      autopayApi: base.autopayApi,
      securityApi: base.securityApi,
      cardApi: base.cardApi,
      serviceRequestApi: _TestServiceRequestApi(),
      votingApi: base.votingApi,
      sessionStore: SessionStore(),
    );
    final controller = AppController(services: services);

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const ServiceRequestDetailScreen(requestId: 'svc_relationship_1'),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Joint account relationship request'), findsOneWidget);
    expect(find.text('Relationship type'), findsOneWidget);
    expect(find.text('spouse'), findsOneWidget);
    expect(find.text('Related member number'), findsOneWidget);
    expect(find.text('BUN-100112'), findsNWidgets(2));
    expect(find.text('Attachments'), findsOneWidget);
    expect(find.text('marriage-certificate.pdf'), findsOneWidget);

    controller.dispose();
  });
}

class _TestServiceRequestApi implements ServiceRequestApi {
  @override
  Future<ServiceRequest> createRequest({
    required String type,
    required String title,
    required String description,
    Map<String, dynamic>? payload,
    List<String>? attachments,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<ServiceRequest> fetchRequestDetail(String requestId) async {
    if (requestId == 'svc_relationship_1') {
      return ServiceRequest(
        id: requestId,
        type: 'account_relationship',
        title: 'Joint account relationship request',
        description: 'Customer requested to add a spouse relationship for joint account servicing.',
        status: 'under_review',
        latestNote: 'Relationship evidence is under branch review.',
        createdAt: DateTime(2026, 3, 8, 10, 5),
        payload: const {
          'relationshipType': 'spouse',
          'relatedMemberNumber': 'BUN-100112',
          'relatedCustomerId': 'BUN-100112',
        },
        attachments: const ['marriage-certificate.pdf'],
        timeline: const [
          ServiceRequestEvent(
            id: 'evt_relationship_1',
            eventType: 'status_updated',
            actorType: 'staff',
            actorName: 'Rahel Desta',
            note: 'Relationship evidence is under branch review.',
          ),
        ],
      );
    }

    if (requestId == 'svc_phone_1') {
      return ServiceRequest(
        id: requestId,
        type: 'phone_update',
        title: 'Phone number update request',
        description: 'Customer requested to replace the number linked to the account.',
        status: 'awaiting_customer',
        latestNote: 'Please upload a clearer selfie verification image.',
        createdAt: DateTime(2026, 3, 9, 14, 20),
        payload: const {
          'requestedPhoneNumber': '0911000099',
        },
        attachments: const ['fayda-front.jpg', 'selfie.jpg'],
        timeline: const [
          ServiceRequestEvent(
            id: 'evt_phone_1',
            eventType: 'status_updated',
            actorType: 'staff',
            actorName: 'Rahel Desta',
            note: 'Please upload a clearer selfie verification image.',
          ),
        ],
      );
    }

    return ServiceRequest(
      id: requestId,
      type: 'payment_dispute',
      title: 'Merchant charge dispute',
      description: 'Customer reported duplicate merchant charge.',
      status: 'submitted',
      latestNote: 'Awaiting review.',
      createdAt: DateTime(2026, 3, 10, 9, 0),
      payload: const {
        'transactionReference': 'TXN-2026-001',
        'amount': 12000,
        'counterparty': 'Dashen Bank',
        'occurredAt': '2026-03-09 14:30',
      },
      attachments: const ['receipt.png'],
      timeline: const [
        ServiceRequestEvent(
          id: 'evt_1',
          eventType: 'created',
          actorType: 'member',
          actorName: 'Abebe Kebede',
          note: 'Customer reported duplicate merchant charge.',
        ),
      ],
    );
  }

  @override
  Future<List<ServiceRequest>> fetchMyRequests() async => const [];
}
