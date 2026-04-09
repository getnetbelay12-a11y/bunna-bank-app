import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/app_notification.dart';
import '../../chat/presentation/live_chat_detail_screen.dart';
import '../../cards/presentation/card_management_screen.dart';
import '../../loans/presentation/loan_detail_screen.dart';
import '../../membership/presentation/fayda_verification_screen.dart';
import '../../payments/presentation/payment_receipt_detail_screen.dart';
import '../../payments/presentation/payment_receipts_screen.dart';
import '../../announcements/presentation/shareholder_announcement_detail_screen.dart';
import '../../school_payments/presentation/school_payment_screen.dart';
import '../../service_requests/presentation/service_request_detail_screen.dart';
import '../../settings/presentation/settings_screen.dart';
import '../../shareholder/presentation/shareholder_dashboard_screen.dart';
import '../../voting/presentation/vote_detail_screen.dart';
import '../../voting/presentation/voting_screen.dart';
import 'notification_display.dart';

Future<void> openNotificationFromInbox(
  NavigatorState navigator,
  AppNotification item,
) async {
  if (_isVotingNotification(item)) {
    final deepLink = item.deepLink;
    if (deepLink != null && deepLink.isNotEmpty) {
      await openNotificationDeepLink(navigator, deepLink);
      return;
    }

    if (item.entityId != null && item.entityId!.isNotEmpty) {
      await navigator.push(
        MaterialPageRoute<void>(
          builder: (_) => VoteDetailScreen(voteId: item.entityId!),
        ),
      );
      return;
    }
  }

  if (isShareholderNotification(item)) {
    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => ShareholderAnnouncementDetailScreen(notification: item),
      ),
    );
    return;
  }

  final deepLink = item.deepLink;
  if (deepLink != null && deepLink.isNotEmpty) {
    await openNotificationDeepLink(navigator, deepLink);
    return;
  }

  if (item.entityType == 'service_request' && item.entityId != null) {
    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => ServiceRequestDetailScreen(requestId: item.entityId!),
      ),
    );
    return;
  }

  if (item.entityType == 'card') {
    await navigator.push(
      MaterialPageRoute<void>(builder: (_) => const CardManagementScreen()),
    );
    return;
  }

  if (item.entityType == 'loan' && item.entityId != null) {
    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => LoanDetailScreen(loanId: item.entityId!),
      ),
    );
    return;
  }

  if (item.entityType == 'shareholder_vote' && item.entityId != null) {
    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => VoteDetailScreen(voteId: item.entityId!),
      ),
    );
  }
}

bool _isVotingNotification(AppNotification item) {
  final type = item.type.toLowerCase();
  final entityType = (item.entityType ?? '').toLowerCase();
  final deepLink = (item.deepLink ?? '').toLowerCase();

  return type.contains('vote') ||
      entityType == 'shareholder_vote' ||
      deepLink.startsWith('/shareholder/voting');
}

Future<void> openNotificationDeepLink(
  NavigatorState navigator,
  String deepLink,
) async {
  if (deepLink.startsWith('/service-requests/')) {
    final requestId = deepLink.substring('/service-requests/'.length);
    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => ServiceRequestDetailScreen(requestId: requestId),
      ),
    );
    return;
  }
  if (deepLink.startsWith('/loans/')) {
    final loanId = deepLink.substring('/loans/'.length);
    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => LoanDetailScreen(loanId: loanId),
      ),
    );
    return;
  }
  if (deepLink.startsWith('/support/')) {
    final conversationId = deepLink.substring('/support/'.length);
    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => LiveChatDetailScreen(conversationId: conversationId),
      ),
    );
    return;
  }
  if (deepLink.startsWith('/payments/school')) {
    final uri = Uri.tryParse(deepLink);
    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => SchoolPaymentScreen(
          initialStudentId: uri?.queryParameters['studentId'],
        ),
      ),
    );
    return;
  }
  if (deepLink.startsWith('/school-payment/')) {
    final uri = Uri.tryParse(deepLink);
    final studentId = uri != null && uri.pathSegments.isNotEmpty
        ? uri.pathSegments.last
        : null;
    final receiptId = uri?.queryParameters['receiptId'];

    if (receiptId != null && receiptId.isNotEmpty) {
      await navigator.push(
        MaterialPageRoute<void>(
          builder: (_) => PaymentReceiptDetailScreen(
            receiptId: receiptId,
            studentId: studentId,
          ),
        ),
      );
      return;
    }

    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => SchoolPaymentScreen(initialStudentId: studentId),
      ),
    );
    return;
  }
  if (deepLink.startsWith('/cards/')) {
    await navigator.push(
      MaterialPageRoute<void>(builder: (_) => const CardManagementScreen()),
    );
    return;
  }
  if (deepLink.startsWith('/payments/receipts')) {
    final uri = Uri.tryParse(deepLink);
    final receiptId = uri?.queryParameters['receiptId'];
    if (receiptId != null && receiptId.isNotEmpty) {
      await navigator.push(
        MaterialPageRoute<void>(
          builder: (_) => PaymentReceiptDetailScreen(
            receiptId: receiptId,
            studentId: uri?.queryParameters['studentId'],
          ),
        ),
      );
      return;
    }
    final filter = receiptFilterFromQuery(uri?.queryParameters['filter']);
    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => PaymentReceiptsScreen(initialFilter: filter),
      ),
    );
    return;
  }
  if (deepLink.startsWith('/fayda-verification')) {
    await navigator.push(
      MaterialPageRoute<void>(builder: (_) => const FaydaVerificationScreen()),
    );
    return;
  }
  if (deepLink.startsWith('/kyc')) {
    await navigator.push(
      MaterialPageRoute<void>(builder: (_) => const FaydaVerificationScreen()),
    );
    return;
  }
  if (deepLink.startsWith('/profile/security')) {
    await navigator.push(
      MaterialPageRoute<void>(builder: (_) => const SettingsScreen()),
    );
    return;
  }
  if (deepLink.startsWith('/shareholder/voting/')) {
    final voteId = deepLink.substring('/shareholder/voting/'.length);
    await navigator.push(
      MaterialPageRoute<void>(
        builder: (_) => VoteDetailScreen(voteId: voteId),
      ),
    );
    return;
  }
  if (deepLink.startsWith('/shareholder/voting')) {
    await navigator.push(
      MaterialPageRoute<void>(builder: (_) => const VotingScreen()),
    );
    return;
  }
  if (deepLink.startsWith('/shareholder')) {
    final appScope = AppScope.of(navigator.context);
    final session = appScope.session;
    if (session != null) {
      await navigator.push(
        MaterialPageRoute<void>(
          builder: (_) => ShareholderDashboardScreen(session: session),
        ),
      );
    }
  }
}
