import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/banking_activity_tile.dart';
import '../../../shared/widgets/section_card.dart';
import '../../../shared/widgets/status_cards.dart';

class DocumentVaultScreen extends StatelessWidget {
  const DocumentVaultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<List<LoanSummary>>(
      future: services.loanApi.fetchMyLoans(),
      builder: (context, snapshot) {
        final items = _buildItems(snapshot.data ?? const <LoanSummary>[]);

        return Scaffold(
          appBar: AppBar(title: const Text('Document Vault')),
          body: SafeArea(
            top: false,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Keep important banking records in one place: statements, receipts, loan workflow letters, and KYC submissions.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: abayTextSoft,
                        ),
                  ),
                  const SizedBox(height: 20),
                  SectionCard(
                    title: 'Secure Records',
                    child: Column(
                      children: [
                        for (final item in items) ...[
                          BankingActivityTile(
                            icon: _iconFor(item.category),
                            title: item.title,
                            dateLabel: _dateLabel(item.issuedAt),
                            trailingLabel: _statusLabel(item.status),
                            description:
                                item.description ?? 'Document is available.',
                            badgeLabel: item.category,
                            badgeColor: _badgeColor(item.status),
                          ),
                          if (item != items.last) const SizedBox(height: 12),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  const SectionCard(
                    title: 'Next Improvements',
                    child: ChecklistCard(
                      title: 'Planned upgrades',
                      points: [
                        'Camera/gallery/file pickup for document upload',
                        'PDF preview and download for statements and letters',
                        'Shared backend vault API for mobile and console audit trails',
                      ],
                      tone: StatusCardTone.info,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  List<DocumentVaultItem> _buildItems(List<LoanSummary> loans) {
    final now = DateTime.now();
    final items = <DocumentVaultItem>[
      DocumentVaultItem(
        id: 'statement_mar_2026',
        title: 'Mini Statement',
        category: 'Statement',
        status: 'available',
        issuedAt: now.subtract(const Duration(days: 2)),
        description: 'Recent account summary for quick review and support follow-up.',
      ),
      DocumentVaultItem(
        id: 'receipt_school_payment',
        title: 'School Payment Receipt',
        category: 'Receipt',
        status: 'available',
        issuedAt: now.subtract(const Duration(days: 7)),
        description: 'Proof of school fee payment and reference capture.',
      ),
      DocumentVaultItem(
        id: 'kyc_fayda_submission',
        title: 'Fayda Submission Record',
        category: 'KYC',
        status: 'under_review',
        issuedAt: now.subtract(const Duration(days: 12)),
        description: 'Identity verification package submitted from the onboarding flow.',
      ),
    ];

    for (final loan in loans) {
      items.add(
        DocumentVaultItem(
          id: 'loan_letter_${loan.loanId}',
          title: '${loan.loanType} Status Letter',
          category: 'Loan',
          status: loan.status == 'approved' ? 'available' : 'pending',
          issuedAt: now.subtract(const Duration(days: 4)),
          description:
              'Current workflow summary for ${loan.loanType.toLowerCase()} with next-step visibility.',
        ),
      );
    }

    return items;
  }

  IconData _iconFor(String category) {
    switch (category) {
      case 'Statement':
        return Icons.receipt_long_rounded;
      case 'Receipt':
        return Icons.payments_rounded;
      case 'KYC':
        return Icons.badge_rounded;
      case 'Loan':
        return Icons.account_balance_wallet_rounded;
      default:
        return Icons.folder_open_rounded;
    }
  }

  Color _badgeColor(String status) {
    switch (status) {
      case 'available':
        return abaySuccess;
      case 'under_review':
      case 'pending':
        return abayPrimary;
      default:
        return abayTextSoft;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'available':
        return 'Ready';
      case 'under_review':
        return 'Review';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  }

  String _dateLabel(DateTime value) {
    final month = value.month.toString().padLeft(2, '0');
    final day = value.day.toString().padLeft(2, '0');
    return '${value.year}-$month-$day';
  }
}
