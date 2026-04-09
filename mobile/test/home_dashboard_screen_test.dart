import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/models/index.dart';
import 'package:bunna_bank_mobile/src/core/services/api_contracts.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/session_store.dart';
import 'package:bunna_bank_mobile/src/features/home/presentation/home_dashboard_screen.dart';
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

  testWidgets('home dashboard shows prioritized smart insights and hides old static reminder',
      (tester) async {
    final base = AppServices.demo();
    final services = AppServices(
      authApi: base.authApi,
      locationApi: base.locationApi,
      memberApi: const _TestMemberApi(),
      shareholderApi: base.shareholderApi,
      recommendationApi: base.recommendationApi,
      insightApi: _TestInsightApi.withItems([
        SmartInsight(
          id: 'insight_1',
          type: 'payment_overdue',
          priority: 'high',
          title: 'Loan repayment overdue',
          message: 'A repayment follow-up may be needed for your loan.',
          actionLabel: 'View Loan',
          actionRoute: '/loans/loan_1',
          dueAt: DateTime.now().subtract(const Duration(days: 1)),
        ),
        SmartInsight(
          id: 'insight_2',
          type: 'insurance_due',
          priority: 'medium',
          title: 'Insurance renewal due soon',
          message: 'Your loan-linked insurance expires soon.',
          actionLabel: 'Renew Insurance',
          actionRoute: '/insurance/renew',
          dueAt: DateTime.now().add(const Duration(days: 3)),
        ),
        SmartInsight(
          id: 'insight_3',
          type: 'savings_suggestion',
          priority: 'low',
          title: 'Build a savings cushion',
          message: 'Your recent deposits are steady. Consider moving funds into savings.',
          actionLabel: 'Transfer Funds',
          actionRoute: '/savings/transfer',
          dueAt: DateTime.now().add(const Duration(days: 7)),
        ),
        SmartInsight(
          id: 'insight_4',
          type: 'utility_due',
          priority: 'medium',
          title: 'Utility payment due',
          message: 'Your electricity bill is approaching.',
          actionLabel: 'Pay Now',
          actionRoute: '/payments/autopay',
          dueAt: DateTime.now().add(const Duration(days: 5)),
        ),
      ]),
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
    final controller = AppController(services: services);
    addTearDown(controller.dispose);
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

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const HomeDashboardScreen(session: session),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(HomeDashboardScreen), findsOneWidget);
    expect(find.text('Available balance'), findsOneWidget);
    expect(find.byType(ListView), findsWidgets);
  });

  testWidgets('home dashboard shows savings-oriented empty state when no insights exist',
      (tester) async {
    final base = AppServices.demo();
    final services = AppServices(
      authApi: base.authApi,
      locationApi: base.locationApi,
      memberApi: const _TestMemberApi(),
      shareholderApi: base.shareholderApi,
      recommendationApi: base.recommendationApi,
      insightApi: _TestInsightApi.withItems(const []),
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
    final controller = AppController(services: services);
    addTearDown(controller.dispose);
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

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const HomeDashboardScreen(session: session),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(HomeDashboardScreen), findsOneWidget);
    expect(find.text('Available balance'), findsOneWidget);
    expect(find.byType(ListView), findsWidgets);
  });
}

class _TestInsightApi implements InsightApi {
  _TestInsightApi.withItems(this._items);

  final List<SmartInsight> _items;

  @override
  Future<SmartInsightFeed> fetchMyInsights() async {
    return SmartInsightFeed(
      generatedAt: DateTime.now(),
      total: _items.length,
      urgentCount: _items.where((item) => item.priority == 'high').length,
      items: _items,
    );
  }

  @override
  Future<SmartInsightFeed> fetchMyHomeInsights() async {
    return SmartInsightFeed(
      generatedAt: DateTime.now(),
      total: _items.length,
      urgentCount: _items.where((item) => item.priority == 'high').length,
      items: _items.take(3).toList(),
    );
  }
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
        type: 'payment',
        channel: 'mobile_push',
        status: 'unread',
        title: 'Payment received',
        message: 'Your school payment was processed successfully.',
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
