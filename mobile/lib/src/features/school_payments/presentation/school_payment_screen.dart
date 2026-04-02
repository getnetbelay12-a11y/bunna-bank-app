import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../shared/widgets/section_card.dart';

class SchoolPaymentScreen extends StatefulWidget {
  const SchoolPaymentScreen({super.key});

  @override
  State<SchoolPaymentScreen> createState() => _SchoolPaymentScreenState();
}

class _SchoolPaymentScreenState extends State<SchoolPaymentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _studentIdController = TextEditingController(text: 'ST-1001');
  final _schoolNameController =
      TextEditingController(text: 'Blue Nile Academy');
  final _amountController = TextEditingController(text: '1500');
  String? _message;
  bool _submitting = false;

  @override
  void dispose() {
    _studentIdController.dispose();
    _schoolNameController.dispose();
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
          child: Center(
            child: Text('Please sign in to use school payment.'),
          ),
        ),
      );
    }

    return FutureBuilder<List<dynamic>>(
      future: Future.wait([
        services.savingsApi.fetchMyAccounts(session.memberId),
        services.schoolPaymentApi.fetchMySchoolPayments(),
      ]),
      builder: (context, snapshot) {
        final accounts = snapshot.data?[0] as List<dynamic>? ?? [];
        final payments = snapshot.data?[1] as List<dynamic>? ?? [];
        final selectedAccountId =
            accounts.isNotEmpty ? accounts.first.accountId as String : '';

        return Scaffold(
          appBar: AppBar(title: const Text('School Payment')),
          resizeToAvoidBottomInset: true,
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
                    Text(
                      'Pay school fees',
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Create a school payment using a linked savings account and review recent payment history.',
                    ),
                    const SizedBox(height: 20),
                    SectionCard(
                      title: 'Payment Details',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextFormField(
                            controller: _studentIdController,
                            decoration:
                                const InputDecoration(labelText: 'Student ID'),
                            validator: (value) =>
                                (value == null || value.trim().isEmpty)
                                    ? 'Student ID is required.'
                                    : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _schoolNameController,
                            decoration:
                                const InputDecoration(labelText: 'School Name'),
                            validator: (value) =>
                                (value == null || value.trim().isEmpty)
                                    ? 'School name is required.'
                                    : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _amountController,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            decoration:
                                const InputDecoration(labelText: 'Amount'),
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
                          ],
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton(
                              onPressed: accounts.isEmpty || _submitting
                                  ? null
                                  : () async {
                                      if (!_formKey.currentState!.validate()) {
                                        return;
                                      }

                                      setState(() {
                                        _submitting = true;
                                        _message = null;
                                      });

                                      final result = await services
                                          .schoolPaymentApi
                                          .createSchoolPayment(
                                        accountId: selectedAccountId,
                                        studentId:
                                            _studentIdController.text.trim(),
                                        schoolName:
                                            _schoolNameController.text.trim(),
                                        amount: double.parse(
                                            _amountController.text),
                                        channel: 'mobile',
                                        narration: 'Mobile school payment',
                                      );

                                      if (!mounted) {
                                        return;
                                      }

                                      setState(() {
                                        _submitting = false;
                                        _message =
                                            'Payment recorded: ${result.transactionReference}';
                                      });
                                    },
                              child: Text(
                                _submitting
                                    ? 'Submitting...'
                                    : 'Submit Payment',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    SectionCard(
                      title: 'Recent Payments',
                      child: Column(
                        children: [
                          for (final payment in payments) ...[
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text('${payment['schoolName']}'),
                              subtitle: Text('${payment['status']}'),
                              trailing: Text('ETB ${payment['amount']}'),
                            ),
                            if (payment != payments.last)
                              const Divider(height: 1),
                          ],
                        ],
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
}
