import 'package:flutter/material.dart';

import '../../../../widgets/cbe_bank_logo.dart';
import '../../../app/app_scope.dart';
import 'otp_verification_screen.dart';

class CreateAccountScreen extends StatefulWidget {
  const CreateAccountScreen({super.key});

  static const routeName = '/create-account';

  @override
  State<CreateAccountScreen> createState() => _CreateAccountScreenState();
}

class _CreateAccountScreenState extends State<CreateAccountScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  String? _message;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
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
                const Center(child: CbeBankLogo(width: 112)),
                const SizedBox(height: 16),
                Text(
                  'Open membership account',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Start with your phone number, verify by OTP, then continue with Fayda KYC, selfie confirmation, and account setup.',
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    hintText: '0911xxxxxx',
                  ),
                  validator: (value) => (value == null || value.trim().isEmpty)
                      ? 'Phone number is required.'
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
                      final result =
                          await services.authApi.checkExistingAccount(
                        phoneNumber: _phoneController.text.trim(),
                      );

                      if (!context.mounted) {
                        return;
                      }

                      if (result.exists) {
                        setState(() {
                          _message = result.message;
                        });
                        return;
                      }

                      await services.authApi
                          .requestOtp(_phoneController.text.trim());
                      if (!context.mounted) {
                        return;
                      }

                      navigator.push(
                        MaterialPageRoute<void>(
                          builder: (_) => OtpVerificationScreen(
                            phoneNumber: _phoneController.text.trim(),
                          ),
                        ),
                      );
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
