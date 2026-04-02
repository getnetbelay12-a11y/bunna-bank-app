import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import 'kyc_onboarding_screen.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({
    super.key,
    required this.phoneNumber,
  });

  static const routeName = '/otp-verification';

  final String phoneNumber;

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController(text: '123456');
  String? _message;

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

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
                  'Verify OTP',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                Text('Enter the code sent to ${widget.phoneNumber}.'),
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
                    onPressed: () async {
                      if (!_formKey.currentState!.validate()) {
                        return;
                      }

                      final navigator = Navigator.of(context);
                      final result = await services.authApi.verifyOtp(
                        phoneNumber: widget.phoneNumber,
                        otpCode: _otpController.text.trim(),
                      );

                      if (!context.mounted) {
                        return;
                      }

                      if (result['status'] == 'verified') {
                        navigator.push(
                          MaterialPageRoute<void>(
                            builder: (_) => KycOnboardingScreen(
                              phoneNumber: widget.phoneNumber,
                            ),
                          ),
                        );
                      } else {
                        setState(() {
                          _message = 'OTP verification failed.';
                        });
                      }
                    },
                    child: const Text('Continue'),
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
