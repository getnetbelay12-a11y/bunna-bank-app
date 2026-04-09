import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../core/services/app_services.dart';
import '../../../shared/widgets/section_card.dart';
import 'payment_receipt_detail_screen.dart';

class PaymentReceiptsScreen extends StatefulWidget {
  const PaymentReceiptsScreen({
    super.key,
    this.initialFilter = PaymentReceiptFilter.all,
  });

  final PaymentReceiptFilter initialFilter;

  @override
  State<PaymentReceiptsScreen> createState() => _PaymentReceiptsScreenState();
}

enum PaymentReceiptFilter {
  all,
  qr,
  school,
  disputes,
}

class _PaymentReceiptsScreenState extends State<PaymentReceiptsScreen> {
  late PaymentReceiptFilter _activeFilter;

  @override
  void initState() {
    super.initState();
    _activeFilter = widget.initialFilter;
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<_PaymentReceiptsViewData>(
      future: _loadPaymentData(services),
      builder: (context, snapshot) {
        final viewData = snapshot.data;
        final summary = viewData?.summary;
        final receipts = viewData?.receipts ?? const <PaymentReceiptItem>[];
        final confirmedPayments = receipts
            .where(
              (item) =>
                  item.receiptType == 'school_payment' ||
                  item.receiptType == 'qr_payment',
            )
            .toList();
        final filteredConfirmedPayments =
            _activeFilter == PaymentReceiptFilter.qr
                ? confirmedPayments
                    .where((item) => item.receiptType == 'qr_payment')
                    .toList()
                : _activeFilter == PaymentReceiptFilter.school
                    ? confirmedPayments
                        .where((item) => item.receiptType == 'school_payment')
                        .toList()
                    : _activeFilter == PaymentReceiptFilter.disputes
                        ? <PaymentReceiptItem>[]
                        : confirmedPayments;
        final paymentCases = receipts
            .where(
              (item) =>
                  item.receiptType == 'payment_dispute' ||
                  item.receiptType == 'failed_transfer',
            )
            .toList();
        final filteredPaymentCases =
            _activeFilter == PaymentReceiptFilter.disputes
                ? paymentCases
                : paymentCases;

        return Scaffold(
          appBar: AppBar(title: const Text('Payment Receipts')),
          body: SafeArea(
            top: false,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (summary != null) ...[
                    _PaymentActivitySummaryCard(
                      summary: summary,
                      activeFilter: _activeFilter,
                      onFilterSelected: (filter) {
                        setState(() {
                          _activeFilter = filter;
                        });
                      },
                    ),
                    const SizedBox(height: 20),
                  ],
                  Text(
                    'Review recent payment records, school-fee confirmations, and uploaded receipt evidence linked to payment issues.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: abayTextSoft,
                        ),
                  ),
                  const SizedBox(height: 20),
                  SectionCard(
                    title: _activeFilter == PaymentReceiptFilter.qr
                        ? 'QR Payments'
                        : _activeFilter == PaymentReceiptFilter.school
                            ? 'School Payments'
                            : 'Confirmed Payments',
                    child: filteredConfirmedPayments.isEmpty
                        ? const _EmptyReceiptState(
                            title: 'No payment receipts yet',
                            description:
                                'Your confirmed school and QR payments will appear here once a payment is recorded.',
                          )
                        : Column(
                            children: [
                              for (final payment
                                  in filteredConfirmedPayments) ...[
                                _ReceiptTile(
                                  title: payment.title,
                                  subtitle: _confirmedPaymentSubtitle(payment),
                                  trailing: _moneyLabel(payment.amount),
                                  badgeLabel:
                                      '${_labelFromValue(payment.receiptType)} · ${_labelFromValue(payment.status)}',
                                  onTap: () => Navigator.of(context).push(
                                    MaterialPageRoute<void>(
                                      builder: (_) =>
                                          PaymentReceiptDetailScreen(
                                        receiptId: payment.receiptId,
                                        studentId: payment.metadata['studentId']
                                            ?.toString(),
                                      ),
                                    ),
                                  ),
                                  details: [
                                    if (payment.metadata['studentId'] != null)
                                      'Student ID: ${payment.metadata['studentId']}',
                                    if (payment.counterparty != null &&
                                        payment.receiptType == 'qr_payment')
                                      'Merchant: ${payment.counterparty}',
                                    if (payment.channel != null)
                                      'Channel: ${_labelFromValue(payment.channel!)}',
                                    if (payment.metadata['qrPayload'] != null)
                                      'QR Payload: ${payment.metadata['qrPayload']}',
                                    if (payment.recordedAt != null)
                                      'Recorded: ${_formatValue(payment.recordedAt!)}',
                                  ],
                                ),
                                if (payment != filteredConfirmedPayments.last)
                                  const SizedBox(height: 12),
                              ],
                            ],
                          ),
                  ),
                  const SizedBox(height: 20),
                  SectionCard(
                    title: 'Payment Issue Evidence',
                    child: filteredPaymentCases.isEmpty
                        ? const _EmptyReceiptState(
                            title: 'No payment issue receipts yet',
                            description:
                                'Receipts attached to failed transfer and payment dispute cases will appear here.',
                          )
                        : Column(
                            children: [
                              for (final request in filteredPaymentCases) ...[
                                _ReceiptTile(
                                  title: request.title,
                                  subtitle: request.description,
                                  trailing: _labelFromValue(request.status),
                                  badgeLabel:
                                      _labelFromValue(request.receiptType),
                                  details: [
                                    if (request.transactionReference != null)
                                      'Reference: ${request.transactionReference}',
                                    if (request.amount != null)
                                      'Amount: ${_moneyLabel(request.amount)}',
                                    if (request.counterparty != null)
                                      'Counterparty: ${request.counterparty}',
                                    if (request.metadata['occurredAt'] != null)
                                      'Occurred: ${request.metadata['occurredAt']}',
                                    if (request.attachments.isNotEmpty)
                                      'Evidence: ${request.attachments.join(', ')}'
                                    else
                                      'Evidence: Awaiting receipt upload',
                                  ],
                                ),
                                if (request != filteredPaymentCases.last)
                                  const SizedBox(height: 12),
                              ],
                            ],
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
}

PaymentReceiptFilter receiptFilterFromQuery(String? value) {
  switch (value) {
    case 'qr':
      return PaymentReceiptFilter.qr;
    case 'school':
      return PaymentReceiptFilter.school;
    case 'disputes':
      return PaymentReceiptFilter.disputes;
    case 'all':
    default:
      return PaymentReceiptFilter.all;
  }
}

Future<_PaymentReceiptsViewData> _loadPaymentData(AppServices services) async {
  final results = await Future.wait<dynamic>([
    services.schoolPaymentApi.fetchMyPaymentActivity(),
    services.schoolPaymentApi.fetchMyPaymentReceipts(),
  ]);

  return _PaymentReceiptsViewData(
    summary: results[0] as PaymentActivitySummary?,
    receipts: results[1] as List<PaymentReceiptItem>,
  );
}

class _PaymentReceiptsViewData {
  const _PaymentReceiptsViewData({
    required this.summary,
    required this.receipts,
  });

  final PaymentActivitySummary? summary;
  final List<PaymentReceiptItem> receipts;
}

class _PaymentActivitySummaryCard extends StatelessWidget {
  const _PaymentActivitySummaryCard({
    required this.summary,
    required this.activeFilter,
    required this.onFilterSelected,
  });

  final PaymentActivitySummary summary;
  final PaymentReceiptFilter activeFilter;
  final ValueChanged<PaymentReceiptFilter> onFilterSelected;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Payment Activity Summary',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            summary.memberName,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Customer ID: ${summary.customerId}'
            '${summary.branchName != null ? ' · ${summary.branchName}' : ''}',
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _SummaryChip(
                label: 'Open Cases',
                value: summary.openCases.toString(),
                isActive: activeFilter == PaymentReceiptFilter.disputes,
                onTap: () => onFilterSelected(PaymentReceiptFilter.disputes),
              ),
              _SummaryChip(
                label: 'Total Receipts',
                value: summary.totalReceipts.toString(),
                isActive: activeFilter == PaymentReceiptFilter.all,
                onTap: () => onFilterSelected(PaymentReceiptFilter.all),
              ),
              _SummaryChip(
                label: 'QR',
                value: summary.qrPayments.toString(),
                isActive: activeFilter == PaymentReceiptFilter.qr,
                onTap: () => onFilterSelected(PaymentReceiptFilter.qr),
              ),
              _SummaryChip(
                label: 'School',
                value: summary.schoolPayments.toString(),
                isActive: activeFilter == PaymentReceiptFilter.school,
                onTap: () => onFilterSelected(PaymentReceiptFilter.school),
              ),
              _SummaryChip(
                label: 'Disputes',
                value: summary.disputeReceipts.toString(),
                isActive: activeFilter == PaymentReceiptFilter.disputes,
                onTap: () => onFilterSelected(PaymentReceiptFilter.disputes),
              ),
            ],
          ),
          if (summary.latestActivityAt != null) ...[
            const SizedBox(height: 12),
            Text('Latest activity: ${_formatValue(summary.latestActivityAt!)}'),
          ],
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({
    required this.label,
    required this.value,
    required this.isActive,
    this.onTap,
  });

  final String label;
  final String value;
  final bool isActive;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isActive ? abayAccentSoft : Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? abayAccentSoft : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isActive ? abayPrimary : abayBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: abayTextSoft,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: abayPrimary,
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReceiptTile extends StatelessWidget {
  const _ReceiptTile({
    required this.title,
    required this.subtitle,
    required this.trailing,
    required this.badgeLabel,
    required this.details,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final String trailing;
  final String badgeLabel;
  final List<String> details;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Ink(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: abayBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                        ),
                        const SizedBox(height: 6),
                        Text(subtitle),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        trailing,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              color: abayPrimary,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      if (onTap != null) ...[
                        const SizedBox(height: 8),
                        const Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 16,
                          color: abayTextSoft,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: abayAccentSoft,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      badgeLabel,
                      style: const TextStyle(
                        color: abayPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              for (final detail in details) ...[
                Text(detail),
                if (detail != details.last) const SizedBox(height: 6),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyReceiptState extends StatelessWidget {
  const _EmptyReceiptState({
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: abayBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
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

String _confirmedPaymentSubtitle(PaymentReceiptItem payment) {
  final reference = payment.transactionReference;
  if (reference != null && reference.isNotEmpty) {
    return 'Reference: $reference';
  }

  final createdAt = payment.recordedAt;
  if (createdAt != null) {
    return 'Recorded: ${_formatValue(createdAt)}';
  }

  return 'Payment recorded successfully.';
}

String _moneyLabel(num? amount) {
  if (amount == null) {
    return 'ETB -';
  }

  final whole = amount % 1 == 0;
  return whole ? 'ETB ${amount.toInt()}' : 'ETB ${amount.toStringAsFixed(2)}';
}

String _labelFromValue(String value) {
  return value
      .split('_')
      .map((part) =>
          part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

String _formatValue(Object value) {
  if (value is DateTime) {
    final month = value.month.toString().padLeft(2, '0');
    final day = value.day.toString().padLeft(2, '0');
    final hour = value.hour.toString().padLeft(2, '0');
    final minute = value.minute.toString().padLeft(2, '0');
    return '${value.year}-$month-$day $hour:$minute';
  }

  return value.toString();
}
