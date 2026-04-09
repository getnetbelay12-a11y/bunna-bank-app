import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/models/index.dart';
import 'package:bunna_bank_mobile/src/core/services/api_contracts.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/session_store.dart';
import 'package:bunna_bank_mobile/src/features/navigation/presentation/member_shell.dart';
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

  const session = MemberSession(
    memberId: 'member_1',
    customerId: 'BUN-100001',
    fullName: 'Abebe Kebede',
    phone: '0911000001',
    memberType: MemberType.member,
    branchName: 'Bahir Dar Branch',
    membershipStatus: 'active',
    identityVerificationStatus: 'verified',
    featureFlags: MemberFeatureFlags.defaults(),
  );

  testWidgets('member shell keeps the five main banking tabs', (tester) async {
    final controller = AppController(services: _buildTestServices());
    addTearDown(controller.dispose);

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const MemberShell(session: session),
      ),
    );
    await tester.pump();

    expect(find.text('Home'), findsWidgets);
    expect(find.text('Payments'), findsWidgets);
    expect(find.text('Transactions'), findsWidgets);
    expect(find.text('Support'), findsWidgets);
    expect(find.text('Profile'), findsWidgets);
  });

  testWidgets('member shell drawer routes to the simplified app sections', (tester) async {
    final controller = AppController(services: _buildTestServices());
    addTearDown(controller.dispose);

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const MemberShell(session: session),
      ),
    );
    await tester.pump();

    await tester.tap(find.byIcon(Icons.menu_rounded));
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsWidgets);
    expect(find.text('Payments'), findsWidgets);
    expect(find.text('Transactions'), findsWidgets);
    expect(find.text('Support'), findsWidgets);
    expect(find.text('Profile'), findsWidgets);
    expect(find.text('Help & Support'), findsNothing);
  });
}

AppServices _buildTestServices() {
  final base = AppServices.demo();
  return AppServices(
    authApi: base.authApi,
    locationApi: base.locationApi,
    memberApi: const _TestMemberApi(),
    shareholderApi: base.shareholderApi,
    recommendationApi: base.recommendationApi,
    insightApi: const _TestInsightApi(),
    identityVerificationApi: base.identityVerificationApi,
    savingsApi: const _TestSavingsApi(),
    schoolPaymentApi: base.schoolPaymentApi,
    loanApi: const _TestLoanApi(),
    notificationApi: const _TestNotificationApi(),
    documentUploadApi: base.documentUploadApi,
    chatApi: base.chatApi,
    autopayApi: base.autopayApi,
    securityApi: base.securityApi,
    cardApi: base.cardApi,
    serviceRequestApi: base.serviceRequestApi,
    votingApi: const _TestVotingApi(),
    sessionStore: SessionStore(),
  );
}

class _TestMemberApi implements MemberApi {
  const _TestMemberApi();

  @override
  Future<MemberProfile> fetchMyProfile(String memberId) async {
    return const MemberProfile(
      memberId: 'member_1',
      customerId: 'BUN-100001',
      memberNumber: 'AB-100001',
      fullName: 'Abebe Kebede',
      phone: '0911000001',
      branchName: 'Bahir Dar Branch',
      memberType: 'member',
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      onboardingReviewStatus: 'approved',
    );
  }
}

class _TestInsightApi implements InsightApi {
  const _TestInsightApi();

  @override
  Future<SmartInsightFeed> fetchMyInsights() async {
    return await fetchMyHomeInsights();
  }

  @override
  Future<SmartInsightFeed> fetchMyHomeInsights() async {
    return SmartInsightFeed(
      generatedAt: DateTime.now(),
      total: 1,
      urgentCount: 1,
      items: [
        SmartInsight(
          id: 'loan_due_1',
          type: 'loan_due',
          priority: 'high',
          title: 'Loan payment due',
          message: 'Your next repayment is approaching.',
          actionLabel: 'View Loan',
          actionRoute: '/loans/loan_1',
          dueAt: DateTime.now().add(const Duration(days: 2)),
        ),
      ],
    );
  }
}

class _TestSavingsApi implements SavingsApi {
  const _TestSavingsApi();

  @override
  Future<List<SavingsAccount>> fetchMyAccounts(String memberId) async {
    return const [
      SavingsAccount(
        accountId: 'acc_1',
        accountNumber: '1000123456789',
        balance: 14500,
        currency: 'ETB',
        isActive: true,
      ),
    ];
  }

  @override
  Future<List<AccountTransaction>> fetchAccountTransactions(String accountId) async {
    return const [];
  }
}

class _TestLoanApi implements LoanApi {
  const _TestLoanApi();

  @override
  Future<List<LoanSummary>> fetchMyLoans() async {
    return [
      LoanSummary(
        loanId: 'loan_1',
        loanType: 'Business Loan',
        amount: 250000,
        interestRate: 13.5,
        termMonths: 24,
        status: 'under_review',
        currentLevel: 'branch_review',
        createdAt: DateTime(2026, 1, 10),
      ),
    ];
  }

  @override
  Future<LoanSummary> fetchLoanDetail(String loanId) {
    throw UnimplementedError();
  }

  @override
  Future<List<LoanTimelineItem>> fetchLoanTimeline(String loanId) {
    throw UnimplementedError();
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

class _TestNotificationApi implements NotificationApi {
  const _TestNotificationApi();

  @override
  Future<List<AppNotification>> fetchMyNotifications() async {
    return [
      AppNotification(
        notificationId: 'note_1',
        type: 'loan_due',
        channel: 'mobile_push',
        status: 'unread',
        title: 'Loan due soon',
        message: 'Your repayment is due in 2 days.',
        createdAt: DateTime.now().subtract(const Duration(hours: 3)),
      ),
    ];
  }

  @override
  Future<AppNotification> markAsRead(String notificationId) {
    throw UnimplementedError();
  }

  @override
  Future<void> registerDeviceToken({
    required String deviceId,
    required String platform,
    required String token,
    required String appVersion,
  }) async {}
}

class _TestVotingApi implements VotingApi {
  const _TestVotingApi();

  @override
  Future<List<VoteSummary>> fetchActiveVotes() async {
    return const [];
  }

  @override
  Future<VoteDetail> fetchVoteDetail(String voteId) {
    throw UnimplementedError();
  }

  @override
  Future<Map<String, dynamic>> submitVote(
    String voteId, {
    required String optionId,
    required String encryptedBallot,
    required String otpCode,
  }) {
    throw UnimplementedError();
  }
}
