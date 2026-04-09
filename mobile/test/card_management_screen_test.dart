import 'package:bunna_bank_mobile/src/app/app_controller.dart';
import 'package:bunna_bank_mobile/src/app/app_scope.dart';
import 'package:bunna_bank_mobile/src/core/models/index.dart';
import 'package:bunna_bank_mobile/src/core/services/api_contracts.dart';
import 'package:bunna_bank_mobile/src/core/services/app_services.dart';
import 'package:bunna_bank_mobile/src/core/services/session_store.dart';
import 'package:bunna_bank_mobile/src/features/cards/presentation/card_management_screen.dart';
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

  testWidgets('card management shows card state, timestamps, and channel controls', (tester) async {
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
      cardApi: _TestCardApi(),
      serviceRequestApi: base.serviceRequestApi,
      votingApi: base.votingApi,
      sessionStore: SessionStore(),
    );
    final controller = AppController(services: services);

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const CardManagementScreen(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Debit Card'), findsOneWidget);
    expect(find.text('Issued: 2026-03-01 09:00'), findsOneWidget);
    expect(find.text('Channel controls'), findsOneWidget);
    expect(find.text('ATM: Enabled'), findsOneWidget);
    expect(find.text('ECOMMERCE: Disabled'), findsOneWidget);

    controller.dispose();
  });

  testWidgets('card management locks a card from the detail actions', (tester) async {
    final base = AppServices.demo();
    final cardApi = _TestCardApi();
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
      cardApi: cardApi,
      serviceRequestApi: base.serviceRequestApi,
      votingApi: base.votingApi,
      sessionStore: SessionStore(),
    );
    final controller = AppController(services: services);

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const CardManagementScreen(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(FilledButton, 'Lock Card'));
    await tester.pumpAndSettle();

    expect(cardApi.lockedCardIds, contains('card_1'));
    expect(find.textContaining('is now locked'), findsOneWidget);
    expect(find.text('Unlock Card'), findsOneWidget);
    expect(find.text('Locked at: 2026-03-31 09:30'), findsOneWidget);

    controller.dispose();
  });

  testWidgets('card management submits a replacement request from the card actions',
      (tester) async {
    final base = AppServices.demo();
    final cardApi = _TestCardApi();
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
      cardApi: cardApi,
      serviceRequestApi: base.serviceRequestApi,
      votingApi: base.votingApi,
      sessionStore: SessionStore(),
    );
    final controller = AppController(services: services);

    await tester.pumpWidget(
      wrapWithScope(
        controller: controller,
        child: const CardManagementScreen(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(OutlinedButton, 'Request Replacement'));
    await tester.pumpAndSettle();

    expect(cardApi.replacementRequestedCardIds, contains('card_1'));
    expect(find.textContaining('Replacement request submitted.'), findsOneWidget);
    expect(find.text('Status: REPLACEMENT REQUESTED'), findsOneWidget);

    controller.dispose();
  });
}

class _TestCardApi implements CardApi {
  final List<String> lockedCardIds = [];
  final List<String> unlockedCardIds = [];
  final List<String> replacementRequestedCardIds = [];
  CardItem _card = CardItem(
    id: 'card_1',
    cardType: 'Debit Card',
    last4: '4821',
    status: 'active',
    preferredBranch: 'Bahir Dar Branch',
    channelControls: const {
      'atm': true,
      'pos': true,
      'ecommerce': false,
    },
    issuedAt: DateTime(2026, 3, 1, 9, 0),
  );

  @override
  Future<CardRequestResult> createCardRequest({
    String requestType = 'new_issue',
    String? preferredBranch,
    String? reason,
    String? cardType,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<List<CardItem>> fetchMyCards() async {
    return [_card];
  }

  @override
  Future<CardItem> lockCard(String cardId) async {
    lockedCardIds.add(cardId);
    _card = CardItem(
      id: _card.id,
      cardType: _card.cardType,
      last4: _card.last4,
      status: 'locked',
      preferredBranch: _card.preferredBranch,
      channelControls: _card.channelControls,
      issuedAt: _card.issuedAt,
      lockedAt: DateTime(2026, 3, 31, 9, 30),
    );
    return _card;
  }

  @override
  Future<CardRequestResult> requestReplacement(String cardId, {String? reason}) async {
    replacementRequestedCardIds.add(cardId);
    _card = CardItem(
      id: _card.id,
      cardType: _card.cardType,
      last4: _card.last4,
      status: 'replacement_requested',
      preferredBranch: _card.preferredBranch,
      channelControls: _card.channelControls,
      issuedAt: _card.issuedAt,
    );
    return const CardRequestResult(
      id: 'card_req_replace_1',
      requestType: 'replacement',
      status: 'submitted',
      cardId: 'card_1',
    );
  }

  @override
  Future<CardItem> unlockCard(String cardId) async {
    unlockedCardIds.add(cardId);
    _card = CardItem(
      id: _card.id,
      cardType: _card.cardType,
      last4: _card.last4,
      status: 'active',
      preferredBranch: _card.preferredBranch,
      channelControls: _card.channelControls,
      issuedAt: _card.issuedAt,
    );
    return _card;
  }
}
