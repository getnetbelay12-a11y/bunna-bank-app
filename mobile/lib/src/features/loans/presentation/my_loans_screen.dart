import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/loan_summary.dart';
import '../../../shared/widgets/banking_activity_tile.dart';
import '../../../shared/widgets/section_card.dart';
import 'loan_application_screen.dart';
import 'loan_detail_screen.dart';
import 'loan_document_upload_screen.dart';

class MyLoansScreen extends StatelessWidget {
  const MyLoansScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<List<LoanSummary>>(
      future: services.loanApi.fetchMyLoans(),
      builder: (context, snapshot) {
        final loans = snapshot.data ?? const [];

        return Material(
          color: const Color(0xFFF5F7FB),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              Text(
                'Loan Activity',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Track every stage from draft to disbursement with clear workflow visibility.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: const Color(0xFF64748B),
                    ),
              ),
              const SizedBox(height: 16),
              SectionCard(
                title: 'Loans',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        FilledButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => const LoanApplicationScreen(),
                              ),
                            );
                          },
                          child: const Text('Apply Loan'),
                        ),
                        FilledButton.tonal(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) =>
                                    const LoanDocumentUploadScreen(),
                              ),
                            );
                          },
                          child: const Text('Upload Documents'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    for (final loan in loans)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: BankingActivityTile(
                          icon: Icons.account_balance_wallet_rounded,
                          title: loan.loanType,
                          dateLabel: _levelLabel(loan.currentLevel),
                          trailingLabel:
                              'ETB ${loan.amount.toStringAsFixed(0)}',
                          description:
                              loan.purpose ?? 'Loan purpose not provided.',
                          badgeLabel: _statusLabel(loan.status),
                          badgeColor: _statusColor(loan.status),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => const LoanDetailScreen(),
                              ),
                            );
                          },
                        ),
                      ),
                    const SizedBox(height: 20),
                    const _RepaymentScheduleCard(),
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

  String _statusLabel(String value) => value.replaceAll('_', ' ').toUpperCase();

  String _levelLabel(String value) =>
      'Stage: ${value.replaceAll('_', ' ').toUpperCase()}';

  Color _statusColor(String status) {
    if (status.contains('approved') || status.contains('disbursed')) {
      return Colors.green;
    }
    if (status.contains('rejected')) {
      return Colors.red;
    }
    return cbeBlue;
  }
}

class _RepaymentScheduleCard extends StatelessWidget {
  const _RepaymentScheduleCard();

  @override
  Widget build(BuildContext context) {
    const repayments = [
      (
        title: 'Monthly repayment',
        date: '2026-03-28',
        amount: 'ETB 18,500',
        description: 'Scheduled deduction for active salary-backed loan.',
      ),
      (
        title: 'Insurance renewal',
        date: '2026-04-05',
        amount: 'ETB 4,200',
        description: 'Linked insurance reminder before next repayment cycle.',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Repayment Schedule',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 12),
        for (final item in repayments) ...[
          BankingActivityTile(
            icon: Icons.event_repeat_rounded,
            title: item.title,
            dateLabel: item.date,
            trailingLabel: item.amount,
            description: item.description,
            badgeLabel: 'Upcoming',
          ),
          if (item != repayments.last) const SizedBox(height: 12),
        ],
      ],
    );
  }
}
