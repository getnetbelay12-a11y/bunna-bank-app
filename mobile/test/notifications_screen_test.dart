import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/models/index.dart';
import 'package:bunna_bank_mobile/src/core/services/api_contracts.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/session_store.dart';
import 'package:bunna_bank_mobile/src/features/notifications/presentation/notifications_screen.dart';
import 'package:bunna_bank_mobile/src/shared/widgets/app_new_badge.dart';
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

  testWidgets('notification taps route to request, loan, chat, card, kyc, school pay, voting, and payment receipt screens',
      (tester) async {
    final base = AppServices.demo();
    final services = AppServices(
      authApi: base.authApi,
      locationApi: base.locationApi,
      memberApi: base.memberApi,
      shareholderApi: base.shareholderApi,
      recommendationApi: base.recommendationApi,
      insightApi: base.insightApi,
      identityVerificationApi: _TestIdentityVerificationApi(),
      savingsApi: base.savingsApi,
      schoolPaymentApi: base.schoolPaymentApi,
      loanApi: _TestLoanApi(),
      notificationApi: _TestNotificationApi(),
      documentUploadApi: base.documentUploadApi,
      chatApi: _TestChatApi(),
      autopayApi: base.autopayApi,
      securityApi: base.securityApi,
      cardApi: base.cardApi,
      serviceRequestApi: _TestServiceRequestApi(),
      votingApi: base.votingApi,
      sessionStore: SessionStore(),
    );
    final controller = AppController(services: services);
    controller.setPreviewSession(const MemberSession(
      memberId: 'member_1',
      customerId: 'BUN-100001',
      fullName: 'Abebe Kebede',
      phone: '0911000001',
      memberType: MemberType.shareholder,
      branchName: 'Bahir Dar Branch',
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      featureFlags: MemberFeatureFlags(
        voting: true,
        announcements: true,
        dividends: false,
        schoolPayment: true,
        loans: true,
        savings: true,
        liveChat: true,
      ),
    ));

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const NotificationsScreen(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Notification Center'), findsOneWidget);
    expect(find.byType(AppNewBadge), findsOneWidget);

    await tester.tap(find.text('Request updated'));
    await tester.pumpAndSettle();
    expect(find.text('Request Detail'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Loan review started'));
    await tester.pumpAndSettle();
    expect(find.text('Loan Detail'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Support replied'));
    await tester.pumpAndSettle();
    expect(find.text('Live Chat'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.text('Card request under review'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.drag(find.byType(Scrollable).first, const Offset(0, -120));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Card request under review'));
    await tester.pumpAndSettle();
    expect(find.text('Card Management'), findsOneWidget);
    expect(find.text('Debit Card'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Payment receipts need review'));
    await tester.tap(find.text('Payment receipts need review'));
    await tester.pumpAndSettle();
    expect(find.text('Payment Receipts'), findsOneWidget);
    expect(find.text('Payment Issue Evidence'), findsOneWidget);
    expect(find.text('Transfer issue for TXN-2026-001'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('KYC action required'));
    await tester.tap(find.text('KYC action required'));
    await tester.pumpAndSettle();
    expect(find.text('Fayda Verification'), findsWidgets);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('School fee due'));
    await tester.tap(find.text('School fee due'));
    await tester.pumpAndSettle();
    expect(find.text('School Payment'), findsWidgets);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Vote is now open'));
    await tester.tap(find.text('Vote is now open'));
    await tester.pumpAndSettle();
    expect(find.text('Vote Detail'), findsOneWidget);

    controller.dispose();
  });
}

class _TestNotificationApi implements NotificationApi {
  final List<AppNotification> _items = [
    AppNotification(
      notificationId: 'notif_request',
      type: 'service_request',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Request updated',
      message: 'Your request moved to under review.',
      createdAt: DateTime(2026, 3, 31, 8, 0),
      entityType: 'service_request',
      entityId: 'sr_1',
      actionLabel: 'Open request',
      priority: 'normal',
      deepLink: '/service-requests/sr_1',
    ),
    AppNotification(
      notificationId: 'notif_loan',
      type: 'loan_status',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Loan review started',
      message: 'Your loan is now under branch review.',
      createdAt: DateTime(2026, 3, 31, 8, 5),
      entityType: 'loan',
      entityId: 'loan_1',
      actionLabel: 'Open loan',
      priority: 'normal',
      deepLink: '/loans/loan_1',
    ),
    AppNotification(
      notificationId: 'notif_chat',
      type: 'chat',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Support replied',
      message: 'An agent replied to your support chat.',
      createdAt: DateTime(2026, 3, 31, 8, 10),
      entityType: 'ChatConversation',
      entityId: 'chat_1',
      actionLabel: 'Open support',
      priority: 'high',
      deepLink: '/support/chat_1',
    ),
    AppNotification(
      notificationId: 'notif_card',
      type: 'service_request',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Card request under review',
      message: 'Your new card request is now under review by branch operations.',
      createdAt: DateTime(2026, 3, 31, 8, 12),
      entityType: 'card',
      entityId: 'card_1',
      actionLabel: 'Open card',
      priority: 'normal',
      deepLink: '/cards/card_1',
    ),
    AppNotification(
      notificationId: 'notif_receipts',
      type: 'payment',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Payment receipts need review',
      message: 'Check the payment receipt history for unresolved disputes.',
      createdAt: DateTime(2026, 3, 31, 8, 14),
      entityType: 'payment_receipts',
      entityId: 'member_1',
      actionLabel: 'Open receipts',
      priority: 'normal',
      deepLink: '/payments/receipts?filter=disputes',
    ),
    AppNotification(
      notificationId: 'notif_kyc',
      type: 'system',
      channel: 'mobile_push',
      status: 'sent',
      title: 'KYC action required',
      message: 'Upload a clearer Fayda front image.',
      createdAt: DateTime(2026, 3, 31, 8, 15),
      entityType: 'kyc',
      entityId: 'member_1',
      actionLabel: 'Review KYC',
      priority: 'high',
      deepLink: '/fayda-verification',
    ),
    AppNotification(
      notificationId: 'notif_school',
      type: 'school_payment_due',
      channel: 'mobile_push',
      status: 'sent',
      title: 'School fee due',
      message: 'School fee for March is due soon.',
      createdAt: DateTime(2026, 3, 31, 8, 18),
      entityType: 'school_payment',
      entityId: 'school_1',
      actionLabel: 'Open school pay',
      priority: 'normal',
      deepLink: '/payments/school/school_1',
    ),
    AppNotification(
      notificationId: 'notif_vote',
      type: 'vote_open',
      channel: 'mobile_push',
      status: 'sent',
      title: 'Vote is now open',
      message: 'The annual shareholder vote is open.',
      createdAt: DateTime(2026, 3, 31, 8, 20),
      entityType: 'shareholder_vote',
      entityId: 'vote_1',
      actionLabel: 'Vote now',
      priority: 'high',
      deepLink: '/shareholder/voting/vote_1',
    ),
  ];

  @override
  Future<List<AppNotification>> fetchMyNotifications() async => _items;

  @override
  Future<AppNotification> markAsRead(String notificationId) async {
    final item = _items.firstWhere((entry) => entry.notificationId == notificationId);
    return AppNotification(
      notificationId: item.notificationId,
      type: item.type,
      channel: item.channel,
      status: 'read',
      title: item.title,
      message: item.message,
      createdAt: item.createdAt,
      entityType: item.entityType,
      entityId: item.entityId,
      actionLabel: item.actionLabel,
      priority: item.priority,
      deepLink: item.deepLink,
    );
  }

  @override
  Future<void> registerDeviceToken({
    required String deviceId,
    required String platform,
    required String token,
    required String appVersion,
  }) async {}
}

class _TestLoanApi implements LoanApi {
  @override
  Future<LoanSummary> fetchLoanDetail(String loanId) async {
    return LoanSummary(
      loanId: loanId,
      loanType: 'Business Loan',
      amount: 150000,
      interestRate: 14.5,
      termMonths: 24,
      status: 'branch_review',
      currentLevel: 'branch',
      purpose: 'Working capital',
    );
  }

  @override
  Future<List<LoanSummary>> fetchMyLoans() async => const [];

  @override
  Future<List<LoanTimelineItem>> fetchLoanTimeline(String loanId) async {
    return const [
      LoanTimelineItem(
        title: 'Submitted',
        description: 'Application received successfully.',
        status: 'submitted',
        isCompleted: true,
      ),
    ];
  }

  @override
  Future<LoanSummary> submitLoanApplication({
    required String loanType,
    required double amount,
    required double interestRate,
    required int termMonths,
    required String purpose,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<Map<String, dynamic>> uploadLoanDocument(
    String loanId, {
    required String documentType,
    required String originalFileName,
    String? storageKey,
    String? mimeType,
    int? sizeBytes,
  }) {
    throw UnimplementedError();
  }
}

class _TestChatApi implements ChatApi {
  @override
  Future<ChatConversation> createConversation({
    required String issueCategory,
    String? loanId,
    String? initialMessage,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<ChatConversation> fetchConversation(String conversationId) async {
    return ChatConversation(
      id: conversationId,
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      status: 'waiting_customer',
      issueCategory: 'general_help',
      channel: 'mobile',
      createdAt: DateTime(2026, 3, 31, 8, 0),
      updatedAt: DateTime(2026, 3, 31, 8, 5),
      escalationFlag: false,
      priority: 'normal',
      messages: [
        ChatMessage(
          id: 'msg_1',
          conversationId: 'chat_1',
          senderType: 'agent',
          senderName: 'Support Agent',
          message: 'We are reviewing your request.',
          messageType: 'text',
          createdAt: DateTime(2026, 3, 31, 8, 5),
        ),
      ],
    );
  }

  @override
  Future<List<ChatConversation>> fetchMyConversations() async => const [];

  @override
  Future<ChatConversation> sendMessage(
    String conversationId, {
    required String message,
  }) {
    throw UnimplementedError();
  }
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
    return ServiceRequest(
      id: requestId,
      type: 'phone_update',
      title: 'Phone update request',
      description: 'Customer asked to change their phone number.',
      status: 'under_review',
      createdAt: DateTime(2026, 3, 31, 8, 0),
      latestNote: 'Branch team is reviewing identity evidence.',
      timeline: const [
        ServiceRequestEvent(
          id: 'evt_1',
          eventType: 'created',
          actorType: 'member',
          note: 'Request submitted by customer.',
          toStatus: 'submitted',
        ),
      ],
    );
  }

  @override
  Future<List<ServiceRequest>> fetchMyRequests() async => const [];
}

class _TestIdentityVerificationApi implements IdentityVerificationApi {
  @override
  Future<IdentityVerificationResult> getStatus() async {
    return const IdentityVerificationResult(
      memberId: 'member_1',
      phoneNumber: '0911000001',
      verificationStatus: 'needs_action',
      verificationMethod: 'manual_review',
      faydaFin: '123456789012',
      verificationReference: 'KYC-1001',
    );
  }

  @override
  Future<IdentityVerificationResult> submitFin({
    required String faydaFin,
    String? faydaAlias,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<IdentityVerificationResult> uploadQr({
    String? qrDataRaw,
    String? faydaAlias,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<IdentityVerificationResult> verify() {
    throw UnimplementedError();
  }
}
