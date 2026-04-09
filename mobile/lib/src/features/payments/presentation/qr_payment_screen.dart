import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../../theme/amhara_brand_theme.dart';
import './payment_receipts_screen.dart';

class QrPaymentScreen extends StatefulWidget {
  const QrPaymentScreen({super.key});

  @override
  State<QrPaymentScreen> createState() => _QrPaymentScreenState();
}

class _QrPaymentScreenState extends State<QrPaymentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _qrPayloadController = TextEditingController(text: 'merchant:aba-001');
  final _merchantController = TextEditingController(text: 'ABa Merchant');
  final _amountController = TextEditingController(text: '250');
  String? _message;
  String? _latestReference;
  bool _submitting = false;

  @override
  void dispose() {
    _qrPayloadController.dispose();
    _merchantController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final session = AppScope.of(context).session;

    if (session == null) {
      return const Scaffold(
        body: SafeArea(
          child: Center(child: Text('Please sign in to use QR payment.')),
        ),
      );
    }

    return FutureBuilder<List<SavingsAccount>>(
      future: services.savingsApi.fetchMyAccounts(session.memberId),
      builder: (context, snapshot) {
        final accounts = snapshot.data ?? const <SavingsAccount>[];
        final primaryAccount = accounts.isNotEmpty ? accounts.first : null;
        final selectedAccountId =
            primaryAccount != null ? primaryAccount.accountId : '';

        return Scaffold(
          appBar: AppBar(title: const Text('Scan & Pay')),
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
                            'QR merchant payment',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: abayPrimary,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Paste or scan a merchant QR payload, confirm the merchant, and submit the payment from your primary savings account.',
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    if (primaryAccount != null) ...[
                      Text(
                        'Funding account: ${primaryAccount.accountNumber}',
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Available balance: ${primaryAccount.currency} ${primaryAccount.balance.toStringAsFixed(2)}',
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _qrPayloadController,
                      decoration: const InputDecoration(
                        labelText: 'Merchant QR payload',
                      ),
                      validator: (value) => (value == null || value.trim().isEmpty)
                          ? 'QR payload is required.'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _merchantController,
                      decoration: const InputDecoration(
                        labelText: 'Merchant name',
                      ),
                      validator: (value) => (value == null || value.trim().isEmpty)
                          ? 'Merchant name is required.'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _amountController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Amount'),
                      validator: (value) {
                        final amount = double.tryParse(value ?? '');
                        if (amount == null || amount <= 0) {
                          return 'Enter a valid amount.';
                        }
                        return null;
                      },
                    ),
                    if (_message != null) ...[
                      const SizedBox(height: 12),
                      Text(_message!),
                      if (_latestReference != null) ...[
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => const PaymentReceiptsScreen(
                                    initialFilter: PaymentReceiptFilter.qr,
                                  ),
                                ),
                              );
                          },
                          child: const Text('View QR receipts'),
                        ),
                      ],
                    ],
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: primaryAccount == null || _submitting
                            ? null
                            : () async {
                                if (!_formKey.currentState!.validate()) {
                                  return;
                                }

                                setState(() {
                                  _submitting = true;
                                  _message = null;
                                  _latestReference = null;
                                });

                                final amount = double.parse(_amountController.text);
                                if (amount > primaryAccount.balance) {
                                  setState(() {
                                    _submitting = false;
                                    _message =
                                        'The requested amount exceeds the available savings balance.';
                                  });
                                  return;
                                }

                                try {
                                  final result = await services.schoolPaymentApi.createQrPayment(
                                    accountId: selectedAccountId,
                                    qrPayload: _qrPayloadController.text.trim(),
                                    merchantName: _merchantController.text.trim(),
                                    amount: amount,
                                    narration: 'Mobile QR payment',
                                  );

                                  if (!mounted) {
                                    return;
                                  }

                                  setState(() {
                                    _submitting = false;
                                    _latestReference = result.transactionReference;
                                    _message =
                                        'QR payment sent to ${result.merchantName}. Reference: ${result.transactionReference}';
                                  });
                                } catch (error) {
                                  if (!mounted) {
                                    return;
                                  }
                                  setState(() {
                                    _submitting = false;
                                    _latestReference = null;
                                    _message = _friendlyError(
                                      error,
                                      fallback: 'Unable to submit the QR payment.',
                                    );
                                  });
                                }
                              },
                        child: Text(_submitting ? 'Submitting...' : 'Pay Merchant'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  String _friendlyError(Object error, {required String fallback}) {
    final text = error.toString();
    final trimmed =
        text.startsWith('Exception: ') ? text.substring('Exception: '.length) : text;
    return trimmed.isEmpty ? fallback : trimmed;
  }
}
