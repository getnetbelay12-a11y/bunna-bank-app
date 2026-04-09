import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_input.dart';

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
          final verificationStatus =
              status?.verificationStatus ?? 'not_started';
          final statusTone = _statusTone(verificationStatus);

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
                    AppHeader(
                      title: 'Fayda Verification',
                      subtitle: _statusCopy(verificationStatus),
                    ),
                    const SizedBox(height: 16),
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Status: ${verificationStatus.replaceAll('_', ' ')}',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: statusTone,
                                ),
                          ),
                          if (status?.faydaFin != null || status?.verificationReference != null) ...[
                            const SizedBox(height: 12),
                            Text('Stored FIN: ${status?.faydaFin ?? 'Not submitted'}'),
                            Text('Reference: ${status?.verificationReference ?? 'Pending assignment'}'),
                          ],
                        ],
                      ),
                    ),
                    if (_message != null) ...[
                      const SizedBox(height: 16),
                      Text(_message!),
                    ],
                    const SizedBox(height: 20),
                    AppInput(
                      controller: _finController,
                      label: 'Fayda FIN',
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      controller: _aliasController,
                      label: 'Fayda Alias',
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      label: 'Submit FIN',
                      onPressed: () async {
                        final fin = _finController.text.trim();
                        if (!RegExp(r'^\d{12}$').hasMatch(fin)) {
                          setState(() {
                            _message = 'Fayda FIN must be exactly 12 digits.';
                          });
                          return;
                        }
                        try {
                          final result =
                              await services.identityVerificationApi.submitFin(
                            faydaFin: fin,
                            faydaAlias: _aliasController.text.trim().isEmpty
                                ? null
                                : _aliasController.text.trim(),
                          );
                          setState(() {
                            _message =
                                'FIN submitted with status ${result.verificationStatus}.';
                          });
                        } catch (error) {
                          setState(() {
                            _message = _friendlyError(
                              error,
                              fallback: 'Unable to submit Fayda FIN.',
                            );
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 20),
                    AppInput(
                      controller: _qrController,
                      maxLines: 4,
                      label: 'Fayda QR Payload / Upload Token',
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      label: 'Upload QR / Credential',
                      secondary: true,
                      onPressed: () async {
                        final qrPayload = _qrController.text.trim();
                        if (qrPayload.isEmpty) {
                          setState(() {
                            _message =
                                'Paste the Fayda QR payload or upload token before continuing.';
                          });
                          return;
                        }
                        try {
                          final result =
                              await services.identityVerificationApi.uploadQr(
                            qrDataRaw: qrPayload,
                            faydaAlias: _aliasController.text.trim().isEmpty
                                ? null
                                : _aliasController.text.trim(),
                          );
                          setState(() {
                            _message =
                                'QR submitted with status ${result.verificationStatus}.';
                          });
                        } catch (error) {
                          setState(() {
                            _message = _friendlyError(
                              error,
                              fallback: 'Unable to upload Fayda QR data.',
                            );
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      label: 'Submit For Verification Review',
                      onPressed: () async {
                        try {
                          final result =
                              await services.identityVerificationApi.verify();
                          setState(() {
                            _message = result.failureReason ??
                                'Verification status: ${result.verificationStatus}.';
                          });
                        } catch (error) {
                          setState(() {
                            _message = _friendlyError(
                              error,
                              fallback:
                                  'Unable to submit the verification review request.',
                            );
                          });
                        }
                      },
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

  Color _statusTone(String status) {
    switch (status) {
      case 'verified':
      case 'demo_approved':
        return const Color(0xFF1F6E43);
      case 'failed':
        return const Color(0xFFB23A3A);
      default:
        return const Color(0xFF6B7280);
    }
  }

  String _statusCopy(String status) {
    switch (status) {
      case 'verified':
      case 'demo_approved':
        return 'Your identity is already verified. Sensitive services should now stay available unless your account is locked.';
      case 'pending_verification':
      case 'qr_uploaded':
      case 'manual_review_required':
        return 'Verification is in review. Governance voting, school payment, and card requests may stay restricted until approval is complete.';
      case 'failed':
        return 'Verification failed. Review the Fayda details and resubmit before retrying secure services.';
      default:
        return 'Official Fayda validity is not claimed in manual-review mode. Submit a valid FIN or QR record to begin secure onboarding review.';
    }
  }

  String _friendlyError(Object error, {required String fallback}) {
    final text = error.toString();
    final trimmed = text.startsWith('Exception: ')
        ? text.substring('Exception: '.length)
        : text;
    return trimmed.isEmpty ? fallback : trimmed;
  }
}
