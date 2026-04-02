import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/banking_activity_tile.dart';
import '../../../shared/widgets/section_card.dart';
import '../../notifications/presentation/notifications_screen.dart';
import '../../savings/presentation/savings_overview_screen.dart';

class TransactionsScreen extends StatelessWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final session = controller.session;

    if (session == null) {
      return const SizedBox.shrink();
    }

    final services = controller.services;

    return FutureBuilder<_TransactionData>(
      future: _loadData(services, session.memberId),
      builder: (context, snapshot) {
        final data = snapshot.data;

        return Material(
          color: const Color(0xFFF5F7FB),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: cbeBlue,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Transactions',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Recent account activity, mini statement, and important loan or insurance reminders.',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: const Color(0xFFE4ECFF),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const SectionCard(
                title: 'Important Reminders',
                child: Column(
                  children: [
                    _HighlightReminder(
                      title: 'Loan payment due soon',
                      description:
                          'Your next repayment is scheduled this week. Review the repayment schedule in Loan Tracker.',
                    ),
                    SizedBox(height: 12),
                    _HighlightReminder(
                      title: 'Insurance renewal reminder',
                      description:
                          'An active loan-linked insurance renewal is coming up. Tap the related notification for details.',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SectionCard(
                title: 'Recent Transactions',
                child: data == null || data.transactions.isEmpty
                    ? const Text('No recent transactions available.')
                    : Column(
                        children: [
                          for (final item in data.transactions.take(6)) ...[
                            BankingActivityTile(
                              icon: Icons.swap_vert_circle_rounded,
                              title: item.type.replaceAll('_', ' ').toUpperCase(),
                              dateLabel: item.transactionReference,
                              trailingLabel:
                                  '${item.currency} ${item.amount.toStringAsFixed(0)}',
                              description:
                                  item.narration ?? '${item.channel} transaction',
                              badgeLabel: 'Transaction',
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => const SavingsOverviewScreen(),
                                  ),
                                );
                              },
                            ),
                            if (item != data.transactions.take(6).last)
                              const SizedBox(height: 12),
                          ],
                        ],
                      ),
              ),
              const SizedBox(height: 20),
              SectionCard(
                title: 'Notification Shortcuts',
                child: Column(
                  children: [
                    BankingActivityTile(
                      icon: Icons.notifications_active_rounded,
                      title: 'Loan and insurance notifications',
                      dateLabel: 'Grouped by today and earlier',
                      trailingLabel:
                          '${data?.notifications.where((item) => item.status != 'read').length ?? 0}',
                      description:
                          'Review loan updates, insurance reminders, savings alerts, announcements, and KYC messages.',
                      badgeLabel: 'Notifications',
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const NotificationsScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<_TransactionData> _loadData(dynamic services, String memberId) async {
    final accounts = await services.savingsApi.fetchMyAccounts(memberId);
    final transactions = accounts.isEmpty
        ? const <AccountTransaction>[]
        : await services.savingsApi.fetchAccountTransactions(accounts.first.accountId);
    final notifications = await services.notificationApi.fetchMyNotifications();

    return _TransactionData(
      transactions: transactions,
      notifications: notifications,
    );
  }
}

class _TransactionData {
  const _TransactionData({
    required this.transactions,
    required this.notifications,
  });

  final List<AccountTransaction> transactions;
  final List<AppNotification> notifications;
}

class _HighlightReminder extends StatelessWidget {
  const _HighlightReminder({
    required this.title,
    required this.description,
  });

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFB9DBFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: cbeBlue,
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 6),
          Text(description),
        ],
      ),
    );
  }
}
