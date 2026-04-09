import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/app_notification.dart';
import '../../../core/models/loan_summary.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_list_item.dart';
import '../../../shared/widgets/app_new_badge.dart';
import '../../chat/presentation/live_chat_list_screen.dart';
import '../../chat/presentation/live_chat_detail_screen.dart';
import 'loan_application_screen.dart';
import 'loan_detail_screen.dart';
import 'loan_document_upload_screen.dart';

class MyLoansScreen extends StatelessWidget {
  const MyLoansScreen({
    super.key,
    this.embeddedInTab = false,
  });

  final bool embeddedInTab;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<List<dynamic>>(
      future: Future.wait<dynamic>([
        services.loanApi.fetchMyLoans(),
        services.notificationApi.fetchMyNotifications(),
      ]),
      builder: (context, snapshot) {
        final loans = snapshot.data?[0] as List<LoanSummary>? ?? const <LoanSummary>[];
        final notifications = snapshot.data?[1] as List<AppNotification>? ?? const <AppNotification>[];
        final loanAlerts = notifications
            .where(
              (item) =>
                  item.type.contains('loan') ||
                  item.type.contains('insurance'),
            )
            .take(3)
            .toList();
        final hasActiveLoan = loans.any((item) => item.status != 'rejected');

        final content = ListView(
          padding: EdgeInsets.fromLTRB(20, embeddedInTab ? 12 : 20, 20, 24),
          children: [
                if (embeddedInTab)
                  const AppHeader(
                    title: 'Loans',
                    subtitle: 'Apply, upload documents, track workflow status, and stay ahead of loan reminders.',
                  ),
                if (!embeddedInTab)
                  Text(
                    'Apply, upload documents, track workflow status, and stay ahead of loan reminders.',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                const SizedBox(height: 16),
                AppCard(
                  child: Row(
                    children: [
                      Expanded(
                        child: AppButton(
                          label: 'Apply Loan',
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(builder: (_) => const LoanApplicationScreen()),
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: AppButton(
                          label: 'Upload Docs',
                          secondary: true,
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(builder: (_) => const LoanDocumentUploadScreen()),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Loan overview',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 10),
                      if (!hasActiveLoan)
                        Text(
                          'You have no active loan right now. Start a new application when you need financing.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        )
                      else
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            _SummaryChip(
                              label: 'Active',
                              value: '${loans.where((item) => item.status != 'rejected').length}',
                            ),
                            _SummaryChip(
                              label: 'Need documents',
                              value: '${loans.where((item) => item.status == 'need_documents').length}',
                            ),
                            _SummaryChip(
                              label: 'Approved',
                              value: '${loans.where((item) => item.status == 'approved').length}',
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'My loan tracker',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(width: 8),
                          const AppNewBadge(),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (loans.isEmpty)
                        Text(
                          'Loan applications and repayment milestones will appear here.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        )
                      else
                        for (var index = 0; index < loans.length; index++) ...[
                          AppListItem(
                            title: loans[index].loanType,
                            subtitle:
                                'ETB ${loans[index].amount.toStringAsFixed(0)} · ${_statusLabel(loans[index].status)} · ${_levelLabel(loans[index].currentLevel)}',
                            icon: Icons.account_balance_wallet_outlined,
                            badge: loans[index].status.toUpperCase(),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) => LoanDetailScreen(loanId: loans[index].loanId),
                                ),
                              );
                            },
                          ),
                          if (index != loans.length - 1) const Divider(height: 1),
                        ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Loan and insurance alerts',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      if (loanAlerts.isEmpty)
                        Text(
                          'Loan reminders, insurance due notices, and workflow updates will appear here.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        )
                      else
                        for (var index = 0; index < loanAlerts.length; index++) ...[
                          AppListItem(
                            title: loanAlerts[index].title,
                            subtitle: loanAlerts[index].message,
                            icon: loanAlerts[index].type.contains('insurance')
                                ? Icons.health_and_safety_outlined
                                : Icons.notifications_active_outlined,
                            badge: _timeLabel(loanAlerts[index].createdAt),
                            onTap: () {
                              if (loans.isNotEmpty) {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => LoanDetailScreen(loanId: loans.first.loanId),
                                  ),
                                );
                              }
                            },
                          ),
                          if (index != loanAlerts.length - 1) const Divider(height: 1),
                        ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Need help with a loan?',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Open live chat for document requests, follow-up, or questions about approval progress.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 14),
                      AppButton(
                        label: 'Open Loan Support',
                        secondary: true,
                        onPressed: loans.isEmpty
                            ? () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(builder: (_) => const LiveChatListScreen()),
                                );
                              }
                            : () => _openLoanSupport(context, loans.first),
                      ),
                    ],
                  ),
                ),
          ],
        );

        if (embeddedInTab) {
          return Material(
            color: Colors.white,
            child: SafeArea(top: false, child: content),
          );
        }

        return Scaffold(
          appBar: AppBar(
            leading: const BackButton(),
            title: const Text('Loans'),
          ),
          body: Material(
            color: Colors.white,
            child: SafeArea(top: false, child: content),
          ),
        );
      },
    );
  }

  static String _statusLabel(String value) => value.replaceAll('_', ' ');
  static String _levelLabel(String value) => value.replaceAll('_', ' ');

  Future<void> _openLoanSupport(BuildContext context, LoanSummary loan) async {
    final services = AppScope.of(context).services;
    final conversation = await services.chatApi.createConversation(
      issueCategory: 'loan_issue',
      loanId: loan.loanId,
      initialMessage:
          'I need support for ${loan.loanType}. The loan is currently at ${loan.currentLevel.replaceAll('_', ' ')} review.',
    );

    if (!context.mounted) {
      return;
    }

    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => LiveChatDetailScreen(
          conversationId: conversation.id,
          initialConversation: conversation,
        ),
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFD9E2EE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 2),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

String _timeLabel(DateTime value) {
  final difference = DateTime.now().difference(value);
  if (difference.inHours < 1) {
    return '${difference.inMinutes.clamp(1, 59)}m';
  }
  if (difference.inDays < 1) {
    return '${difference.inHours}h';
  }
  return '${difference.inDays}d';
}
