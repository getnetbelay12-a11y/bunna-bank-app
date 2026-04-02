import 'package:flutter/material.dart';

import '../../../shared/widgets/section_card.dart';

class LoanApplicationScreen extends StatefulWidget {
  const LoanApplicationScreen({super.key});

  @override
  State<LoanApplicationScreen> createState() => _LoanApplicationScreenState();
}

class _LoanApplicationScreenState extends State<LoanApplicationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _loanTypeController = TextEditingController();
  final _amountController = TextEditingController();
  final _purposeController = TextEditingController();

  @override
  void dispose() {
    _loanTypeController.dispose();
    _amountController.dispose();
    _purposeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const checklist = [
      'Choose loan type and repayment term',
      'Enter amount and purpose',
      'Upload required documents',
      'Review branch, district, and head office workflow',
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Apply Loan')),
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
            child: SectionCard(
              title: 'Loan Application',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Start a new loan request with clear document and approval guidance.',
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _loanTypeController,
                    decoration: const InputDecoration(labelText: 'Loan Type'),
                    validator: (value) =>
                        (value == null || value.trim().isEmpty)
                            ? 'Loan type is required.'
                            : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _amountController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Amount'),
                    validator: (value) {
                      final amount = double.tryParse(value ?? '');
                      if (amount == null || amount <= 0) {
                        return 'Enter a valid amount.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _purposeController,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'Purpose'),
                    validator: (value) =>
                        (value == null || value.trim().isEmpty)
                            ? 'Purpose is required.'
                            : null,
                  ),
                  const SizedBox(height: 16),
                  for (final item in checklist) ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(top: 3),
                          child: Icon(Icons.check_circle_rounded, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Expanded(child: Text(item)),
                      ],
                    ),
                    if (item != checklist.last) const SizedBox(height: 12),
                  ],
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {
                        _formKey.currentState!.validate();
                      },
                      child: const Text('Continue Loan Application'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
