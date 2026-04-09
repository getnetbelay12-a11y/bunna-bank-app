import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';

class PaymentIssueReportScreen extends StatefulWidget {
  const PaymentIssueReportScreen({super.key, this.initialType = 'failed_transfer'});

  final String initialType;

  @override
  State<PaymentIssueReportScreen> createState() => _PaymentIssueReportScreenState();
}

class _PaymentIssueReportScreenState extends State<PaymentIssueReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _referenceController = TextEditingController();
  final _amountController = TextEditingController();
  final _counterpartyController = TextEditingController();
  final _occurredAtController = TextEditingController();
  final _descriptionController = TextEditingController();

  late String _type;
  bool _submitting = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _type = widget.initialType;
  }

  @override
  void dispose() {
    _referenceController.dispose();
    _amountController.dispose();
    _counterpartyController.dispose();
    _occurredAtController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final issueLabel = _type == 'payment_dispute' ? 'Payment Dispute' : 'Failed Transfer';

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Report Payment Issue'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            20 + MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5FF),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFB9DBFF)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Track the issue end to end',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: abayPrimary,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Report the transaction problem here and follow review updates from your service request timeline.',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                DropdownButtonFormField<String>(
                  initialValue: _type,
                  decoration: const InputDecoration(labelText: 'Issue Type'),
                  items: const [
                    DropdownMenuItem(
                      value: 'failed_transfer',
                      child: Text('Failed Transfer'),
                    ),
                    DropdownMenuItem(
                      value: 'payment_dispute',
                      child: Text('Payment Dispute'),
                    ),
                  ],
                  onChanged: (value) => setState(() => _type = value ?? _type),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _referenceController,
                  decoration: const InputDecoration(
                    labelText: 'Transaction Reference',
                    helperText: 'Use receipt ID, transfer reference, or trace number if available.',
                  ),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Transaction reference is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Amount'),
                  validator: (value) {
                    final trimmed = value?.trim() ?? '';
                    if (trimmed.isEmpty) {
                      return 'Amount is required.';
                    }
                    if (double.tryParse(trimmed) == null) {
                      return 'Enter a valid amount.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _counterpartyController,
                  decoration: InputDecoration(
                    labelText: _type == 'payment_dispute'
                        ? 'Merchant or Biller'
                        : 'Recipient or Destination Account',
                  ),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'This field is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _occurredAtController,
                  decoration: const InputDecoration(
                    labelText: 'When It Happened',
                    helperText: 'Example: 2025-01-14 14:35',
                  ),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Time of incident is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 5,
                  decoration: InputDecoration(
                    labelText: '$issueLabel Details',
                    alignLabelWithHint: true,
                  ),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Details are required.'
                      : null,
                ),
                if (_message != null) ...[
                  const SizedBox(height: 16),
                  Text(_message!),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _submitting ? null : _submit,
                    child: Text(_submitting ? 'Submitting...' : 'Submit Issue'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _submitting = true;
      _message = null;
    });

    final issueLabel = _type == 'payment_dispute' ? 'Payment dispute' : 'Failed transfer';

    try {
      final created = await AppScope.of(context).services.serviceRequestApi.createRequest(
        type: _type,
        title: '$issueLabel for ${_referenceController.text.trim()}',
        description: _descriptionController.text.trim(),
        payload: {
          'transactionReference': _referenceController.text.trim(),
          'amount': double.parse(_amountController.text.trim()),
          'counterparty': _counterpartyController.text.trim(),
          'occurredAt': _occurredAtController.text.trim(),
        },
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _submitting = false;
        _message =
            '$issueLabel submitted. Request ID: ${created.id} · Status: ${created.status}';
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _submitting = false;
        _message = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }
}
