import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_card.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({
    super.key,
    this.embeddedInTab = false,
  });

  final bool embeddedInTab;

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final session = controller.session;

    if (session == null) {
      return const SizedBox.shrink();
    }

    final services = controller.services;

    return FutureBuilder<List<AccountTransaction>>(
      future: _loadTransactions(services, session.memberId),
      builder: (context, snapshot) {
        final transactions = [...(snapshot.data ?? const <AccountTransaction>[])]
          ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

        final content = ListView(
          padding: EdgeInsets.fromLTRB(20, widget.embeddedInTab ? 12 : 20, 20, 24),
          children: [
            Text(
              'Recent transactions',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: abayPrimary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Review your latest money movement, grouped in a simple activity feed.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: abayTextSoft,
                  ),
            ),
            const SizedBox(height: 16),
            if (transactions.isEmpty)
              const AppCard(
                child: Text('No recent transactions are available yet.'),
              )
            else
              for (final transaction in transactions) ...[
                _TransactionFeedCard(transaction: transaction),
                const SizedBox(height: 12),
              ],
          ],
        );

        if (widget.embeddedInTab) {
          return Material(
            color: Colors.white,
            child: SafeArea(top: false, child: content),
          );
        }

        return Scaffold(
          backgroundColor: Colors.white,
          appBar: AppBar(
            backgroundColor: abayPrimary,
            foregroundColor: abayTopBarForeground,
            leading: const BackButton(),
            title: const Text('Transactions'),
            centerTitle: false,
            actions: [
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(4),
              child: Container(
                height: 4,
                color: abayAccent,
              ),
            ),
          ),
          body: SafeArea(
            top: false,
            child: content,
          ),
        );
      },
    );
  }

  Future<List<AccountTransaction>> _loadTransactions(dynamic services, String memberId) async {
    final accounts = await services.savingsApi.fetchMyAccounts(memberId);
    if (accounts.isEmpty) {
      return const <AccountTransaction>[];
    }
    return services.savingsApi.fetchAccountTransactions(accounts.first.accountId);
  }
}

class _TransactionFeedCard extends StatelessWidget {
  const _TransactionFeedCard({
    required this.transaction,
  });

  final AccountTransaction transaction;

  @override
  Widget build(BuildContext context) {
    final isCredit = _isCredit(transaction);

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: abaySurfaceAlt,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(
              isCredit ? Icons.south_west_rounded : Icons.north_east_rounded,
              color: isCredit ? abaySuccess : abayDanger,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _transactionTitle(transaction),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: abayPrimary,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(transaction.createdAt),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: abayTextSoft,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isCredit ? '' : '-'}${transaction.amount.toStringAsFixed(2)} ${transaction.currency}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: abayPrimary,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 4),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 120),
                child: Text(
                  transaction.narration ?? _transactionNarration(transaction),
                  textAlign: TextAlign.right,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: abayTextSoft,
                      ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

bool _isCredit(AccountTransaction item) {
  const creditTypes = {'deposit', 'incoming_transfer', 'credit_interest'};
  return creditTypes.contains(item.type);
}

String _transactionTitle(AccountTransaction item) {
  if (_isCredit(item)) {
    return 'Deposit';
  }
  if (item.type.contains('withdraw')) {
    return 'Withdrawal';
  }
  if (item.type.contains('transfer')) {
    return 'Transfer';
  }
  return item.type.replaceAll('_', ' ').split(' ').map((part) {
    if (part.isEmpty) {
      return part;
    }
    return '${part[0].toUpperCase()}${part.substring(1)}';
  }).join(' ');
}

String _transactionNarration(AccountTransaction item) {
  final channel = item.channel.toLowerCase();
  if (channel.contains('atm')) {
    return 'ATM Cash Withdrawal';
  }
  if (channel.contains('mobile')) {
    return _isCredit(item) ? 'Mobile Credit' : 'Mobile Debit';
  }
  if (_isCredit(item)) {
    return 'Credit Interest';
  }
  return item.channel.replaceAll('_', ' ');
}

String _formatDate(DateTime value) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${months[value.month - 1]} ${value.day}, ${value.year}';
}
