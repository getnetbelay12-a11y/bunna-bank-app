import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/models/index.dart';
import 'package:bunna_bank_mobile/src/core/services/api_contracts.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/session_store.dart';
import 'package:bunna_bank_mobile/src/features/voting/presentation/voting_screen.dart';
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

  testWidgets('shareholder can review, confirm, and submit a vote once', (
    tester,
  ) async {
    final base = AppServices.demo();
    final votingApi = _TestVotingApi();
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
      serviceRequestApi: base.serviceRequestApi,
      votingApi: votingApi,
      sessionStore: SessionStore(),
    );
    final controller = AppController(services: services);
    controller.setPreviewSession(
      const MemberSession(
        memberId: 'member_shareholder_1',
        customerId: 'BUN-100001',
        fullName: 'Abebe Kebede',
        phone: '0911000001',
        memberType: MemberType.shareholder,
        branchName: 'Bahir Dar Branch',
        membershipStatus: 'active',
        identityVerificationStatus: 'verified',
        featureFlags: MemberFeatureFlags.defaults(
          voting: true,
          announcements: true,
          dividends: true,
        ),
      ),
    );

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const VotingScreen(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Board Election 2026'), findsOneWidget);
    expect(find.text('Vote Now'), findsOneWidget);

    await tester.tap(find.text('Vote Now'));
    await tester.pumpAndSettle();

    expect(find.text('Vote Detail'), findsOneWidget);
    await tester.tap(find.text('Candidate A'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Submit'));
    await tester.pumpAndSettle();

    expect(find.text('Confirm Vote'), findsOneWidget);
    expect(find.text('Candidate A'), findsOneWidget);
    await tester.tap(find.text('Confirm'));
    await tester.pumpAndSettle();

    expect(find.text('Vote submitted successfully'), findsOneWidget);
    expect(votingApi.submittedVoteId, 'vote_2026');
    expect(votingApi.submittedOptionId, 'option_board_a');

    controller.dispose();
  });

  testWidgets('regular members do not see active voting access', (tester) async {
    final controller = AppController(services: AppServices.demo());
    controller.setPreviewSession(
      const MemberSession(
        memberId: 'member_regular_1',
        customerId: 'BUN-200001',
        fullName: 'Regular Member',
        phone: '0911000010',
        memberType: MemberType.member,
        branchName: 'Bahir Dar Branch',
        membershipStatus: 'active',
        identityVerificationStatus: 'verified',
        featureFlags: MemberFeatureFlags.defaults(voting: false),
      ),
    );

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const VotingScreen(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Voting unavailable'), findsOneWidget);
    expect(find.text('Vote Now'), findsNothing);

    controller.dispose();
  });
}

class _TestVotingApi implements VotingApi {
  String? submittedVoteId;
  String? submittedOptionId;

  @override
  Future<List<VoteSummary>> fetchActiveVotes() async {
    return [
      VoteSummary(
        voteId: 'vote_2026',
        title: 'Board Election 2026',
        description: 'Annual shareholder election',
        status: 'open',
        startDate: DateTime(2026, 5, 1),
        endDate: DateTime(2026, 5, 7),
      ),
    ];
  }

  @override
  Future<VoteDetail> fetchVoteDetail(String voteId) async {
    return VoteDetail(
      voteId: voteId,
      title: 'Board Election 2026',
      description: 'Annual shareholder election',
      status: 'open',
      startDate: DateTime(2026, 5, 1),
      endDate: DateTime(2026, 5, 7),
      options: const [
        VoteOption(
          optionId: 'option_board_a',
          voteId: 'vote_2026',
          name: 'Candidate A',
          description: 'Support Candidate A.',
          displayOrder: 1,
        ),
        VoteOption(
          optionId: 'option_board_b',
          voteId: 'vote_2026',
          name: 'Candidate B',
          description: 'Support Candidate B.',
          displayOrder: 2,
        ),
      ],
    );
  }

  @override
  Future<Map<String, dynamic>> submitVote(
    String voteId, {
    required String optionId,
    required String encryptedBallot,
    required String otpCode,
  }) async {
    submittedVoteId = voteId;
    submittedOptionId = optionId;
    return {
      'voteId': voteId,
      'optionId': optionId,
    };
  }
}
