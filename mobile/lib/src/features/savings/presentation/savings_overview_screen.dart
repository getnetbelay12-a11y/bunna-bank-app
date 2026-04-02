import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/feature_placeholder.dart';
import '../../../shared/widgets/info_card.dart';
import '../../../shared/widgets/section_card.dart';

class SavingsOverviewScreen extends StatelessWidget {
  const SavingsOverviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final session = controller.session;

    if (session == null) {
      return const SizedBox.shrink();
    }

    final services = controller.services;

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Savings Overview'),
      ),
      body: SafeArea(
        child: FutureBuilder<SavingsPageData>(
          future: _loadSavingsData(services, session.memberId),
          builder: (context, snapshot) {
            final data = snapshot.data;
            final primary =
                data?.accounts.isNotEmpty == true ? data!.accounts.first : null;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: InfoCard(
                          title: 'Primary Account',
                          value: primary == null
                              ? 'Loading...'
                              : '${primary.currency} ${primary.balance.toStringAsFixed(0)}',
                          caption: primary == null
                              ? 'Account loading'
                              : 'Account ${primary.accountNumber}',
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: InfoCard(
                          title: 'Transactions',
                          value:
                              data == null ? '--' : '${data.transactions.length}',
                          caption: 'Latest account activity',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  if (snapshot.hasError)
                    const FeaturePlaceholder(
                      title: 'Savings Unavailable',
                      description:
                          'Savings accounts or transaction history could not be loaded.',
                    )
                  else if (data == null)
                    const FeaturePlaceholder(
                      title: 'Loading Savings',
                      description: 'Fetching accounts and transaction history.',
                    )
                  else ...[
                    SectionCard(
                      title: 'Accounts',
                      child: Column(
                        children: [
                          for (final account in data.accounts)
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(account.accountNumber),
                              subtitle: Text(
                                account.isActive
                                    ? 'Active account'
                                    : 'Inactive account',
                              ),
                              trailing: Text(
                                '${account.currency} ${account.balance.toStringAsFixed(0)}',
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SectionCard(
                      title: 'Recent Transactions',
                      child: Column(
                        children: [
                          for (final transaction in data.transactions)
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(transaction.type),
                              subtitle: Text(
                                '${transaction.channel} • ${transaction.transactionReference}',
                              ),
                              trailing: Text(
                                '${transaction.currency} ${transaction.amount.toStringAsFixed(0)}',
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Future<SavingsPageData> _loadSavingsData(
      dynamic services, String memberId) async {
    final accounts = await services.savingsApi.fetchMyAccounts(memberId);
    final transactions = accounts.isEmpty
        ? const <AccountTransaction>[]
        : await services.savingsApi.fetchAccountTransactions(
            accounts.first.accountId,
          );

    return SavingsPageData(
      accounts: accounts,
      transactions: transactions,
    );
  }
}

class SavingsPageData {
  const SavingsPageData({
    required this.accounts,
    required this.transactions,
  });

  final List<SavingsAccount> accounts;
  final List<AccountTransaction> transactions;
}
