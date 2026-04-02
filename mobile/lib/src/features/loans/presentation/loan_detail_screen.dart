import 'package:flutter/material.dart';

import '../../../shared/widgets/banking_activity_tile.dart';
import '../../../shared/widgets/section_card.dart';

class LoanDetailScreen extends StatelessWidget {
  const LoanDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const timeline = [
      (
        title: 'Loan submitted',
        date: 'Today',
        description:
            'Your application was received and entered into the review queue.',
        status: 'Submitted',
      ),
      (
        title: 'Branch review',
        date: 'Pending',
        description:
            'Branch team is reviewing the application and uploaded documents.',
        status: 'Branch Review',
      ),
      (
        title: 'District review',
        date: 'Next stage',
        description:
            'Applications above branch approval limits move to district review.',
        status: 'District Review',
      ),
      (
        title: 'Head office approval',
        date: 'If required',
        description:
            'High-value loans continue to head office for final approval.',
        status: 'Head Office',
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        leading: BackButton(
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('Loan Activity'),
      ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              SectionCard(
                title: 'Loan Workflow Timeline',
                child: Column(
                  children: [
                    for (final item in timeline) ...[
                      BankingActivityTile(
                        icon: Icons.account_tree_rounded,
                        title: item.title,
                        dateLabel: item.date,
                        trailingLabel: item.status,
                        description: item.description,
                        badgeLabel: 'Loan',
                      ),
                      if (item != timeline.last) const SizedBox(height: 12),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
