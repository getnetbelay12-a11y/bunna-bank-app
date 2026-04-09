import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import 'kyc_onboarding_screen.dart';
import 'reset_pin_screen.dart';

enum OtpRecoveryMode { onboarding, forgotPin }

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({
    super.key,
    required this.phoneNumber,
    this.email,
    required this.deliveryChannel,
    required this.maskedDestination,
    this.recoveryMode = OtpRecoveryMode.onboarding,
  });

  static const routeName = '/otp-verification';

  final String phoneNumber;
  final String? email;
  final String deliveryChannel;
  final String maskedDestination;
  final OtpRecoveryMode recoveryMode;

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController(text: '123456');
  String? _message;
  bool _submitting = false;

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final deliveryLabel =
        widget.deliveryChannel == 'email' ? 'email address' : 'phone number';

    return Scaffold(
      appBar: AppBar(title: const Text('OTP Verification')),
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            24,
            24,
            24,
            24 + MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.recoveryMode == OtpRecoveryMode.forgotPin
                      ? 'Verify recovery OTP'
                      : 'Verify OTP',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                Text('Enter the code sent to your $deliveryLabel.'),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF4F5),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFD7E2E5)),
                  ),
                  child: Text(
                    'OTP sent to ${widget.maskedDestination}.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'OTP'),
                  validator: (value) => (value == null || value.trim().isEmpty)
                      ? 'OTP is required.'
                      : null,
                ),
                if (_message != null) ...[
                  const SizedBox(height: 12),
                  Text(_message!),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _submitting
                        ? null
                        : () async {
                            if (!_formKey.currentState!.validate()) {
                              return;
                            }

                            setState(() {
                              _submitting = true;
                              _message = null;
                            });

                            final navigator = Navigator.of(context);
                            try {
                              final result = await services.authApi.verifyOtp(
                                phoneNumber: widget.phoneNumber,
                                otpCode: _otpController.text.trim(),
                              );

                              if (!context.mounted) {
                                return;
                              }

                              if (result['status'] == 'verified') {
                                if (widget.recoveryMode ==
                                    OtpRecoveryMode.forgotPin) {
                                  navigator.push(
                                    MaterialPageRoute<void>(
                                      builder: (_) => ResetPinScreen(
                                        phoneNumber: widget.phoneNumber,
                                        email: widget.email,
                                      ),
                                    ),
                                  );
                                } else {
                                  navigator.push(
                                    MaterialPageRoute<void>(
                                      builder: (_) => KycOnboardingScreen(
                                        phoneNumber: widget.phoneNumber,
                                        email: widget.email,
                                      ),
                                    ),
                                  );
                                }
                              } else {
                                setState(() {
                                  _submitting = false;
                                  _message = 'OTP verification failed.';
                                });
                              }
                            } catch (error) {
                              if (!mounted) {
                                return;
                              }
                              setState(() {
                                _submitting = false;
                                _message = error.toString().replaceFirst(
                                      'Exception: ',
                                      '',
                                    );
                              });
                            }
                          },
                    child: Text(_submitting ? 'Verifying...' : 'Continue'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
