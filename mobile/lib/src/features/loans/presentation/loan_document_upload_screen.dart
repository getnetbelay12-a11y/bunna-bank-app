import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/section_card.dart';

class LoanDocumentUploadScreen extends StatefulWidget {
  const LoanDocumentUploadScreen({
    super.key,
    this.loanId,
  });

  final String? loanId;

  @override
  State<LoanDocumentUploadScreen> createState() =>
      _LoanDocumentUploadScreenState();
}

class _LoanDocumentUploadScreenState extends State<LoanDocumentUploadScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedLoanId;
  String _selectedDocumentType = 'National ID';
  PlatformFile? _selectedFile;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _selectedLoanId = widget.loanId;
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    const documentTypes = <String>[
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
            child: FutureBuilder<List<LoanSummary>>(
              future: services.loanApi.fetchMyLoans(),
              builder: (context, snapshot) {
                final loans = snapshot.data ?? const <LoanSummary>[];

                if (_selectedLoanId == null && loans.isNotEmpty) {
                  _selectedLoanId = loans.first.loanId;
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionCard(
                      title: 'Submit to Loan Workflow',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          DropdownButtonFormField<String>(
                            initialValue: _selectedLoanId,
                            decoration: const InputDecoration(
                              labelText: 'Loan application',
                              border: OutlineInputBorder(),
                            ),
                            items: loans
                                .map(
                                  (loan) => DropdownMenuItem<String>(
                                    value: loan.loanId,
                                    child: Text(
                                      '${loan.loanType} • ETB ${loan.amount.toStringAsFixed(0)}',
                                    ),
                                  ),
                                )
                                .toList(),
                            onChanged: widget.loanId == null
                                ? (value) {
                                    setState(() {
                                      _selectedLoanId = value;
                                    });
                                  }
                                : null,
                            validator: (value) {
                              if ((value ?? '').isEmpty) {
                                return 'Select the loan to attach this document.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedDocumentType,
                            decoration: const InputDecoration(
                              labelText: 'Document type',
                              border: OutlineInputBorder(),
                            ),
                            items: documentTypes
                                .map(
                                  (item) => DropdownMenuItem<String>(
                                    value: item,
                                    child: Text(item),
                                  ),
                                )
                                .toList(),
                            onChanged: (value) {
                              if (value == null) {
                                return;
                              }
                              setState(() {
                                _selectedDocumentType = value;
                              });
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            readOnly: true,
                            initialValue: _selectedFile?.name,
                            decoration: const InputDecoration(
                              labelText: 'Selected file',
                              hintText: 'Choose a loan document',
                              border: OutlineInputBorder(),
                            ),
                            validator: (_) {
                              if (_selectedFile == null) {
                                return 'Choose a file to upload.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: OutlinedButton.icon(
                              onPressed: _submitting
                                  ? null
                                  : () async {
                                      final result =
                                          await FilePicker.platform.pickFiles(
                                        allowMultiple: false,
                                        type: FileType.custom,
                                        allowedExtensions: [
                                          'jpg',
                                          'jpeg',
                                          'png',
                                          'pdf',
                                        ],
                                      );
                                      if (result == null ||
                                          result.files.isEmpty) {
                                        return;
                                      }
                                      setState(() {
                                        _selectedFile = result.files.single;
                                      });
                                    },
                              icon: const Icon(Icons.attach_file_rounded),
                              label: Text(
                                _selectedFile == null
                                    ? 'Choose File'
                                    : 'Replace File',
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: FilledButton.icon(
                              onPressed: _submitting
                                  ? null
                                  : () => _submitUpload(context),
                              icon: const Icon(Icons.cloud_upload_rounded),
                              label: Text(
                                _submitting ? 'Uploading...' : 'Upload Document',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    SectionCard(
                      title: 'Common Requests',
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
                              trailing: TextButton(
                                onPressed: () {
                                  setState(() {
                                    _selectedDocumentType = item;
                                  });
                                },
                                child: const Text('Use'),
                              ),
                            ),
                            if (item != documentTypes.last)
                              const Divider(height: 1),
                          ],
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submitUpload(BuildContext context) async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final loanId = _selectedLoanId;
    if (loanId == null || loanId.isEmpty) {
      return;
    }
    final selectedFile = _selectedFile;
    if (selectedFile == null || (selectedFile.path ?? '').isEmpty) {
      return;
    }

    final services = AppScope.of(context).services;

    setState(() {
      _submitting = true;
    });

    try {
      final uploaded = await services.documentUploadApi.uploadDocument(
        filePath: selectedFile.path!,
        originalFileName: selectedFile.name,
        domain: 'loans',
        entityId: loanId,
        documentType: _selectedDocumentType,
      );
      await services.loanApi.uploadLoanDocument(
        loanId,
        documentType: _selectedDocumentType,
        originalFileName: selectedFile.name,
        storageKey: uploaded.storageKey,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
      );

      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Loan document submitted for review.'),
        ),
      );
      Navigator.of(context).pop();
    } catch (_) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Loan document upload failed. Try again.'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }
}
