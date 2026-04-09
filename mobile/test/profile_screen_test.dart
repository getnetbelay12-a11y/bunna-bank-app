import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/models/index.dart';
import 'package:bunna_bank_mobile/src/core/services/api_contracts.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/session_store.dart';
import 'package:bunna_bank_mobile/src/features/profile/presentation/profile_screen.dart';
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

  testWidgets('regular members do not see shareholder services in profile', (tester) async {
    final controller = AppController(services: _buildTestServices());
    addTearDown(controller.dispose);

    const session = MemberSession(
      memberId: 'member_2',
      customerId: 'BUN-100002',
      fullName: 'Meseret Alemu',
      phone: '0911000002',
      memberType: MemberType.member,
      branchName: 'Bahir Dar Branch',
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      featureFlags: MemberFeatureFlags.defaults(),
    );

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const ProfileScreen(session: session),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Shareholder services'), findsNothing);
    expect(find.text('Shareholder Dashboard'), findsNothing);
    expect(find.text('Account'), findsOneWidget);
    expect(find.text('Linked Members'), findsOneWidget);

    await tester.drag(find.byType(ListView), const Offset(0, -500));
    await tester.pump();
    expect(find.text('Security'), findsOneWidget);
  });

  testWidgets('shareholder members see shareholder services in profile', (tester) async {
    final controller = AppController(services: _buildTestServices());
    addTearDown(controller.dispose);

    const session = MemberSession(
      memberId: 'member_1',
      customerId: 'BUN-100001',
      fullName: 'Abebe Kebede',
      phone: '0911000001',
      memberType: MemberType.shareholder,
      branchName: 'Bahir Dar Branch',
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      featureFlags: MemberFeatureFlags.defaults(voting: true, announcements: true),
    );

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const ProfileScreen(session: session),
      ),
    );
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.text('Shareholder Dashboard'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pump();
    expect(find.text('Shareholder Dashboard'), findsOneWidget);
    expect(find.byType(AppNewBadge), findsWidgets);
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
    serviceRequestApi: base.serviceRequestApi,
    votingApi: const _TestVotingApi(),
    sessionStore: SessionStore(),
  );
}

class _TestMemberApi implements MemberApi {
  const _TestMemberApi();

  @override
  Future<MemberProfile> fetchMyProfile(String memberId) async {
    return MemberProfile(
      memberId: memberId,
      customerId: memberId == 'member_1' ? 'BUN-100001' : 'BUN-100002',
      memberNumber: memberId == 'member_1' ? 'AB-100001' : 'AB-100002',
      fullName: memberId == 'member_1' ? 'Abebe Kebede' : 'Meseret Alemu',
      phone: memberId == 'member_1' ? '0911000001' : '0911000002',
      branchName: 'Bahir Dar Branch',
      memberType: memberId == 'member_1' ? 'shareholder' : 'member',
      membershipStatus: 'active',
      identityVerificationStatus: 'verified',
      onboardingReviewStatus: 'approved',
    );
  }
}

class _TestVotingApi implements VotingApi {
  const _TestVotingApi();

  @override
  Future<List<VoteSummary>> fetchActiveVotes() async {
    final now = DateTime.now();
    return [
      VoteSummary(
        voteId: 'vote_1',
        title: 'Board Election',
        description: 'Vote for the next board seat.',
        status: 'open',
        startDate: now.subtract(const Duration(days: 1)),
        endDate: now.add(const Duration(days: 5)),
      ),
    ];
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
