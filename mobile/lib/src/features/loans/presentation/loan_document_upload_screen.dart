import 'package:flutter/material.dart';

import '../../../shared/widgets/section_card.dart';

class LoanDocumentUploadScreen extends StatefulWidget {
  const LoanDocumentUploadScreen({super.key});

  @override
  State<LoanDocumentUploadScreen> createState() =>
      _LoanDocumentUploadScreenState();
}

class _LoanDocumentUploadScreenState extends State<LoanDocumentUploadScreen> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    const documentTypes = [
      'National ID',
      'Income Proof',
      'Collateral Document',
      'Guarantor Document',
      'Passport Photo',
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Upload Loan Documents')),
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
              title: 'Required Documents',
              child: Column(
                children: [
                  for (final item in documentTypes) ...[
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.upload_file_rounded),
                      title: Text(item),
                      subtitle: const Text(
                        'Upload now or re-upload if the document was rejected.',
                      ),
                      trailing: FilledButton.tonal(
                        onPressed: () {},
                        child: const Text('Upload'),
                      ),
                    ),
                    if (item != documentTypes.last) const Divider(height: 1),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
