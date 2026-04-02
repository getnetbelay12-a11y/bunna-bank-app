import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';

class FaydaVerificationScreen extends StatefulWidget {
  const FaydaVerificationScreen({super.key});

  @override
  State<FaydaVerificationScreen> createState() =>
      _FaydaVerificationScreenState();
}

class _FaydaVerificationScreenState extends State<FaydaVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _finController = TextEditingController();
  final _aliasController = TextEditingController();
  final _qrController = TextEditingController();
  String? _message;

  @override
  void dispose() {
    _finController.dispose();
    _aliasController.dispose();
    _qrController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return Scaffold(
      appBar: AppBar(title: const Text('Fayda Verification')),
      resizeToAvoidBottomInset: true,
      body: FutureBuilder<IdentityVerificationResult>(
        future: services.identityVerificationApi.getStatus(),
        builder: (context, snapshot) {
          final status = snapshot.data;

          return SafeArea(
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
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F1FF),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Verification Status: ${status?.verificationStatus ?? 'not_started'}',
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Official Fayda validity is not claimed in manual-review mode. QR or FIN submissions are marked pending until reviewed.',
                          ),
                        ],
                      ),
                    ),
                    if (_message != null) ...[
                      const SizedBox(height: 16),
                      Text(_message!),
                    ],
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _finController,
                      decoration: const InputDecoration(labelText: 'Fayda FIN'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _aliasController,
                      decoration:
                          const InputDecoration(labelText: 'Fayda Alias'),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () async {
                          final result =
                              await services.identityVerificationApi.submitFin(
                            faydaFin: _finController.text.trim(),
                            faydaAlias: _aliasController.text.trim().isEmpty
                                ? null
                                : _aliasController.text.trim(),
                          );
                          setState(() {
                            _message =
                                'FIN submitted with status ${result.verificationStatus}.';
                          });
                        },
                        child: const Text('Submit FIN'),
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _qrController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Fayda QR Payload / Upload Token',
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () async {
                          final result =
                              await services.identityVerificationApi.uploadQr(
                            qrDataRaw: _qrController.text.trim(),
                            faydaAlias: _aliasController.text.trim().isEmpty
                                ? null
                                : _aliasController.text.trim(),
                          );
                          setState(() {
                            _message =
                                'QR submitted with status ${result.verificationStatus}.';
                          });
                        },
                        child: const Text('Upload QR / Credential'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.tonal(
                        onPressed: () async {
                          final result =
                              await services.identityVerificationApi.verify();
                          setState(() {
                            _message = result.failureReason ??
                                'Verification status: ${result.verificationStatus}.';
                          });
                        },
                        child: const Text('Submit For Verification Review'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
