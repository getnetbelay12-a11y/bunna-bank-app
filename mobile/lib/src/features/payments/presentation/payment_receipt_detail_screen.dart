import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/section_card.dart';

class PaymentReceiptDetailScreen extends StatelessWidget {
  const PaymentReceiptDetailScreen({
    super.key,
    required this.receiptId,
    this.studentId,
  });

  final String receiptId;
  final String? studentId;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<List<dynamic>>(
      future: Future.wait<dynamic>([
        services.schoolPaymentApi.fetchMyPaymentReceipts(),
        services.schoolPaymentApi.fetchMyLinkedStudents(),
      ]),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: SafeArea(
              child: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        if (snapshot.hasError) {
          return Scaffold(
            appBar: AppBar(title: const Text('Payment Details')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  _friendlyError(
                    snapshot.error ?? Exception('Unknown error'),
                    fallback: 'Unable to load payment details.',
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          );
        }

        final receipts = snapshot.data?[0] as List<PaymentReceiptItem>? ??
            const <PaymentReceiptItem>[];
        final linkedStudents =
            snapshot.data?[1] as List<Map<String, dynamic>>? ??
                const <Map<String, dynamic>>[];

        final receipt = receipts.cast<PaymentReceiptItem?>().firstWhere(
              (item) => item?.receiptId == receiptId,
              orElse: () => null,
            );

        if (receipt == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Payment Details')),
            body: const Center(child: Text('Payment receipt not found.')),
          );
        }

        final resolvedStudentId =
            studentId ?? receipt.metadata['studentId']?.toString();
        final student = linkedStudents.cast<Map<String, dynamic>?>().firstWhere(
              (item) => item?['studentId']?.toString() == resolvedStudentId,
              orElse: () => null,
            );
        final paymentSummary =
            student?['paymentSummary'] as Map<String, dynamic>?;
        final studentName = student?['fullName']?.toString() ??
            receipt.metadata['studentName']?.toString() ??
            resolvedStudentId ??
            'Not available';
        final schoolName = student?['schoolName']?.toString() ?? receipt.title;

        return Scaffold(
          appBar: AppBar(title: const Text('Payment Details')),
          body: SafeArea(
            top: false,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                SectionCard(
                  title: 'Receipt Summary',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        schoolName,
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        receipt.description,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: abayTextSoft,
                            ),
                      ),
                      const SizedBox(height: 18),
                      _DetailRow(
                        label: 'Amount paid',
                        value: _moneyLabel(receipt.amount, receipt.currency),
                      ),
                      _DetailRow(label: 'Student', value: studentName),
                      if (resolvedStudentId != null)
                        _DetailRow(
                            label: 'Student ID', value: resolvedStudentId),
                      _DetailRow(label: 'School', value: schoolName),
                      _DetailRow(
                        label: 'Status',
                        value: _labelFromValue(receipt.status),
                      ),
                      if (receipt.transactionReference != null)
                        _DetailRow(
                          label: 'Reference',
                          value: receipt.transactionReference!,
                        ),
                      if (receipt.channel != null)
                        _DetailRow(
                          label: 'Channel',
                          value: _labelFromValue(receipt.channel!),
                        ),
                      if (receipt.recordedAt != null)
                        _DetailRow(
                          label: 'Paid on',
                          value: _formatValue(receipt.recordedAt!),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SectionCard(
                  title: 'Next Payment',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow(
                        label: 'Next due date',
                        value: paymentSummary?['nextDueDate']?.toString() ??
                            'Not scheduled',
                      ),
                      _DetailRow(
                        label: 'Expected amount',
                        value: _moneyLabel(
                          paymentSummary?['monthlyFee'] is num
                              ? (paymentSummary!['monthlyFee'] as num)
                                  .toDouble()
                              : null,
                          receipt.currency ?? 'ETB',
                        ),
                      ),
                      if (paymentSummary?['latestInvoiceNo'] != null)
                        _DetailRow(
                          label: 'Latest invoice',
                          value: paymentSummary!['latestInvoiceNo'].toString(),
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
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: abayTextSoft,
                  ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

String _friendlyError(Object error, {required String fallback}) {
  final text = error.toString();
  final trimmed = text.startsWith('Exception: ')
      ? text.substring('Exception: '.length)
      : text;
  return trimmed.isEmpty ? fallback : trimmed;
}

String _moneyLabel(num? amount, String? currency) {
  final resolvedCurrency = currency?.isNotEmpty == true ? currency! : 'ETB';
  if (amount == null) {
    return '$resolvedCurrency -';
  }

  final whole = amount % 1 == 0;
  return whole
      ? '$resolvedCurrency ${amount.toInt()}'
      : '$resolvedCurrency ${amount.toStringAsFixed(2)}';
}

String _labelFromValue(String value) {
  return value
      .split('_')
      .map((part) =>
          part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

String _formatValue(DateTime value) {
  final month = value.month.toString().padLeft(2, '0');
  final day = value.day.toString().padLeft(2, '0');
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '${value.year}-$month-$day $hour:$minute';
}
