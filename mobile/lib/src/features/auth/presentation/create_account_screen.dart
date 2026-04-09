import 'package:flutter/material.dart';

import '../../../../widgets/bunna_bank_logo_compat.dart';
import '../../../app/app_scope.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_input.dart';
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
  final _emailController = TextEditingController();
  String? _message;
  bool _submitting = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _emailController.dispose();
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
                const Center(child: BunnaBankLogo(width: 112)),
                const SizedBox(height: 16),
                const AppHeader(
                  title: 'Open membership account',
                  subtitle:
                      'Start with your phone number, then continue to OTP, identity review, and account setup.',
                ),
                const SizedBox(height: 24),
                AppCard(
                  child: Column(
                    children: [
                      AppInput(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        label: 'Phone Number',
                        hintText: '0911xxxxxx',
                        validator: (value) {
                          final trimmed = value?.trim() ?? '';
                          if (trimmed.isEmpty) {
                            return 'Phone number is required.';
                          }
                          if (!RegExp(r'^(\+251|251|0)?9\d{8}$').hasMatch(trimmed)) {
                            return 'Enter a valid phone number.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      AppInput(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        label: 'Email Address (Optional)',
                        hintText: 'yourname@example.com',
                        helperText: 'Optional backup for OTP and recovery.',
                        validator: (value) {
                          final trimmed = value?.trim() ?? '';
                          if (trimmed.isEmpty) {
                            return null;
                          }
                          if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(trimmed)) {
                            return 'Enter a valid email address.';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
                if (_message != null) ...[
                  const SizedBox(height: 12),
                  Text(_message!),
                ],
                const SizedBox(height: 24),
                AppButton(
                  label: _submitting ? 'Sending OTP...' : 'Continue',
                  onPressed: _submitting
                        ? null
                        : () async {
                            if (!_formKey.currentState!.validate()) {
                              return;
                            }

                            final navigator = Navigator.of(context);
                            final phoneNumber = _phoneController.text.trim();
                            final email = _emailController.text.trim();

                            setState(() {
                              _submitting = true;
                              _message = null;
                            });

                            try {
                              final result =
                                  await services.authApi.checkExistingAccount(
                                phoneNumber: phoneNumber,
                                email: email.isEmpty ? null : email,
                              );

                              if (!context.mounted) {
                                return;
                              }

                              if (result.exists) {
                                setState(() {
                                  _message = result.message;
                                  _submitting = false;
                                });
                                return;
                              }

                              var preferredChannel = 'sms';
                              if (email.isNotEmpty) {
                                final selection = await _selectOtpChannel(
                                  context,
                                  phoneNumber: phoneNumber,
                                  email: email,
                                );
                                if (selection == null) {
                                  setState(() {
                                    _submitting = false;
                                  });
                                  return;
                                }
                                preferredChannel = selection;
                              }

                              final otpResult =
                                  await services.authApi.requestOtp(
                                phoneNumber: phoneNumber,
                                email: email.isEmpty ? null : email,
                                preferredChannel: preferredChannel,
                              );

                              if (!context.mounted) {
                                return;
                              }

                              setState(() {
                                _submitting = false;
                              });

                              navigator.push(
                                MaterialPageRoute<void>(
                                  builder: (_) => OtpVerificationScreen(
                                    phoneNumber: phoneNumber,
                                    email: email.isEmpty ? null : email,
                                    deliveryChannel:
                                        otpResult['deliveryChannel']
                                                as String? ??
                                            preferredChannel,
                                    maskedDestination: otpResult[
                                            'maskedDestination'] as String? ??
                                        (preferredChannel == 'email'
                                            ? _maskEmail(email)
                                            : _maskPhoneNumber(phoneNumber)),
                                  ),
                                ),
                              );
                            } catch (error) {
                              if (!mounted) {
                                return;
                              }
                              setState(() {
                                _submitting = false;
                                _message = _resolveCreateAccountError(error);
                              });
                            }
                          },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<String?> _selectOtpChannel(
    BuildContext context, {
    required String phoneNumber,
    required String email,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Choose OTP delivery',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Phone stays your primary account identifier. Choose where to receive the OTP for this step.',
                ),
                const SizedBox(height: 20),
                _OtpChannelTile(
                  title: 'Send OTP to phone number',
                  subtitle: _maskPhoneNumber(phoneNumber),
                  icon: Icons.sms_outlined,
                  onTap: () => Navigator.of(sheetContext).pop('sms'),
                ),
                const SizedBox(height: 12),
                _OtpChannelTile(
                  title: 'Send OTP to email address',
                  subtitle: _maskEmail(email),
                  icon: Icons.email_outlined,
                  onTap: () => Navigator.of(sheetContext).pop('email'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _maskPhoneNumber(String phoneNumber) {
    if (phoneNumber.length <= 4) {
      return phoneNumber;
    }
    return '${phoneNumber.substring(0, 2)}${List.filled(phoneNumber.length - 4, '*').join()}${phoneNumber.substring(phoneNumber.length - 2)}';
  }

  String _maskEmail(String email) {
    final parts = email.split('@');
    if (parts.length != 2) {
      return email;
    }
    final localPart = parts.first;
    final domain = parts.last;
    final visible = localPart.isEmpty ? '' : localPart[0];
    return '$visible${List.filled(localPart.length > 1 ? localPart.length - 1 : 1, '*').join()}@$domain';
  }
}

String _resolveCreateAccountError(Object error) {
  final message = error.toString().replaceFirst('Exception: ', '').trim();

  if (message.isEmpty) {
    return 'Unable to continue right now. Please try again.';
  }

  if (message.contains('Failed host lookup') ||
      message.contains('Connection refused') ||
      message.contains('SocketException') ||
      message.contains('ClientException')) {
    return 'Unable to reach the server right now. Please try again in a moment.';
  }

  return message;
}

class _OtpChannelTile extends StatelessWidget {
  const _OtpChannelTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Ink(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFD7E2E5)),
          color: Colors.white,
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: const Color(0xFFEEF4F5),
              foregroundColor: const Color(0xFF024561),
              child: Icon(icon),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(subtitle),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded),
          ],
        ),
      ),
    );
  }
}
