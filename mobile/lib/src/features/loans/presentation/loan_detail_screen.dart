import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_new_badge.dart';
import '../../chat/presentation/live_chat_detail_screen.dart';
import '../../profile/presentation/document_vault_screen.dart';
import 'loan_document_upload_screen.dart';

class LoanDetailScreen extends StatelessWidget {
  const LoanDetailScreen({
    super.key,
    required this.loanId,
  });

  final String loanId;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<List<dynamic>>(
      future: Future.wait([
        services.loanApi.fetchLoanDetail(loanId),
        services.loanApi.fetchLoanTimeline(loanId),
      ]),
      builder: (context, snapshot) {
        final loan = snapshot.data?[0] as LoanSummary?;
        final timeline =
            snapshot.data?[1] as List<LoanTimelineItem>? ?? const [];

        return AppScaffold(
          title: 'Loan Detail',
          showBack: true,
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AppHeader(
                    title: loan?.loanType ?? 'Loan Activity',
                    subtitle: loan == null
                        ? 'Loading loan details...'
                        : 'Follow review stages, document requests, repayments, and the next expected action.',
                  ),
                  const SizedBox(height: 16),
                  AppCard(
                    child: loan == null
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 24),
                            child: Center(child: CircularProgressIndicator()),
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'ETB ${loan.amount.toStringAsFixed(0)}',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall
                                    ?.copyWith(
                                      color: abayPrimary,
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  AppBadge(
                                    label: _formatLabel(loan.status),
                                    tone: _statusTone(loan.status),
                                  ),
                                  AppBadge(
                                    label:
                                        'LEVEL ${_formatLabel(loan.currentLevel)}',
                                    tone: AppBadgeTone.neutral,
                                  ),
                                  if (loan.deficiencyReasons.isNotEmpty)
                                    const AppBadge(
                                      label: 'DOCS NEEDED',
                                      tone: AppBadgeTone.warning,
                                    ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              _InfoRow(
                                label: 'Loan ID',
                                value: loan.loanId,
                              ),
                              const Divider(height: 24),
                              _InfoRow(
                                label: 'Purpose',
                                value: loan.purpose ?? 'Not provided',
                              ),
                              const Divider(height: 24),
                              _InfoRow(
                                label: 'Repayment amount',
                                value: loan.amount > 0
                                    ? 'ETB ${(loan.amount / 12).toStringAsFixed(0)} / month'
                                    : 'Not available',
                              ),
                              const Divider(height: 24),
                              _InfoRow(
                                label: 'Next step',
                                value: _nextActionCopy(loan),
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
                            'Loan Workflow Timeline',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(width: 8),
                          const AppNewBadge(),
                        ],
                      ),
                        const SizedBox(height: 12),
                        if (timeline.isEmpty)
                          const Text(
                            'Timeline updates will appear here after submission.',
                            style: TextStyle(color: abayTextSoft),
                          )
                        else
                          for (var index = 0; index < timeline.length; index++) ...[
                            _TimelineStep(item: timeline[index]),
                            if (index != timeline.length - 1)
                              const Padding(
                                padding: EdgeInsets.only(left: 11),
                                child: SizedBox(
                                  height: 18,
                                  child: VerticalDivider(
                                    color: abayBorderStrong,
                                    thickness: 1,
                                  ),
                                ),
                              ),
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
                          'Document Requests',
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 12),
                        if (loan?.deficiencyReasons.isNotEmpty == true) ...[
                          for (final item in loan!.deficiencyReasons) ...[
                            _DocumentRequestRow(label: item),
                            if (item != loan.deficiencyReasons.last)
                              const SizedBox(height: 10),
                          ],
                        ] else
                          const Text(
                            'No active document deficiencies are blocking this loan right now.',
                            style: TextStyle(color: abayTextSoft),
                          ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: AppButton(
                                label: 'Upload Documents',
                                onPressed: loan == null
                                    ? null
                                    : () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute<void>(
                                            builder: (_) =>
                                                LoanDocumentUploadScreen(
                                              loanId: loan.loanId,
                                            ),
                                          ),
                                        );
                                      },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: AppButton(
                                label: 'View Repayment Info',
                                secondary: true,
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute<void>(
                                      builder: (_) =>
                                          const DocumentVaultScreen(),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: AppButton(
                                label: 'Open Loan Support',
                                secondary: true,
                                onPressed: loan == null
                                    ? null
                                    : () => _openLoanSupport(context, loan),
                              ),
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
                        Text(
                          'Notes & Updates',
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 8),
                        if (timeline.isNotEmpty) ...[
                          AppBadge(
                            label: 'Current stage: ${timeline.firstWhere((item) => item.isCurrent, orElse: () => timeline.first).title}',
                            tone: AppBadgeTone.primary,
                          ),
                          const SizedBox(height: 10),
                        ],
                        if (timeline.isEmpty)
                          const Text(
                            'Approval notes and repayment updates will appear here once the branch starts reviewing your file.',
                            style: TextStyle(color: abayTextSoft),
                          )
                        else
                          for (final item in timeline.take(3)) ...[
                            _DocumentRequestRow(
                              label:
                                  '${item.title}: ${item.description}',
                            ),
                            if (item != timeline.take(3).last)
                              const SizedBox(height: 10),
                          ],
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

  String _formatLabel(String value) {
    return value.replaceAll('_', ' ').toUpperCase();
  }

  String _nextActionCopy(LoanSummary loan) {
    switch (loan.status) {
      case 'approved':
      case 'disbursed':
        return 'This loan is already approved for the next operational step.';
      case 'rejected':
        return 'This loan was rejected. Review the reason with support or prepare a corrected submission.';
      default:
        if (loan.deficiencyReasons.isNotEmpty) {
          return 'Additional evidence is still required before approval.';
        }
        return 'Your application is moving through review. Watch for branch, district, or head-office follow-up.';
    }
  }

  AppBadgeTone _statusTone(String status) {
    switch (status) {
      case 'approved':
      case 'disbursed':
        return AppBadgeTone.success;
      case 'rejected':
        return AppBadgeTone.danger;
      default:
        return AppBadgeTone.warning;
    }
  }

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

class _TimelineStep extends StatelessWidget {
  const _TimelineStep({
    required this.item,
  });

  final LoanTimelineItem item;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: item.isCurrent
                ? abayAccent
                : item.isCompleted
                    ? abayPrimary
                    : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(
              color: item.isCurrent
                  ? abayAccent
                  : item.isCompleted
                      ? abayPrimary
                      : abayBorderStrong,
              width: 2,
            ),
          ),
          child: item.isCompleted
              ? const Icon(Icons.check, size: 14, color: Colors.white)
              : item.isCurrent
                  ? const Icon(Icons.arrow_forward_rounded, size: 14, color: Colors.white)
              : null,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        item.title,
                        style: Theme.of(context)
                            .textTheme
                            .titleSmall
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ),
                    AppBadge(
                      label: item.isCurrent
                          ? 'CURRENT'
                          : item.isCompleted
                              ? 'DONE'
                              : 'PENDING',
                      tone: item.isCurrent
                          ? AppBadgeTone.warning
                          : item.isCompleted
                              ? AppBadgeTone.success
                              : AppBadgeTone.neutral,
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  item.description,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: abayTextSoft,
                      ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }
}

class _DocumentRequestRow extends StatelessWidget {
  const _DocumentRequestRow({
    required this.label,
  });

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: abayWarningBg,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.upload_file_rounded, color: abayWarning),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: abayText,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
