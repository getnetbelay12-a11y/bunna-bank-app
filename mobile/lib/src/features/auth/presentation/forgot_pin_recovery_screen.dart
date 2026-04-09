import 'package:flutter/material.dart';

import '../../../app/app_controller.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import 'otp_verification_screen.dart';

class ForgotPinRecoveryScreen extends StatefulWidget {
  const ForgotPinRecoveryScreen({super.key});

  static const routeName = '/forgot-pin-recovery';

  @override
  State<ForgotPinRecoveryScreen> createState() =>
      _ForgotPinRecoveryScreenState();
}

class _ForgotPinRecoveryScreenState extends State<ForgotPinRecoveryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  String? _message;
  bool _submitting = false;

  @override
  void dispose() {
    _identifierController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final controller = AppScope.of(context);
    final isAmharic = controller.language == AppLanguage.amharic;

    return Scaffold(
      appBar: AppBar(title: Text(isAmharic ? 'ፒን መልስ' : 'Forgot PIN')),
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
                  isAmharic ? 'ፒንዎን ያስመልሱ' : 'Recover your PIN',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  isAmharic
                      ? 'የተመዘገበ ስልክ ቁጥርዎን ወይም ኢሜይልዎን ያስገቡ። ሲቀጥሉ በፕሮፋይልዎ ላይ ያሉ የOTP መቀበያ አማራጮች ብቻ ይታያሉ።'
                      : 'Enter your registered phone number or email address. Continue to see only the OTP recovery channels already saved on your profile.',
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _identifierController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: isAmharic
                        ? 'ስልክ ቁጥር ወይም ኢሜይል'
                        : 'Phone Number or Email',
                    hintText: isAmharic
                        ? '0911xxxxxx ወይም yourname@example.com'
                        : '0911xxxxxx or yourname@example.com',
                  ),
                  validator: (value) {
                    final trimmed = value?.trim() ?? '';
                    if (trimmed.isEmpty) {
                      return isAmharic
                          ? 'ስልክ ቁጥር ወይም ኢሜይል ያስፈልጋል።'
                          : 'Phone number or email is required.';
                    }
                    final isPhone =
                        RegExp(r'^(\+251|251|0)?9\d{8}$').hasMatch(trimmed);
                    final isEmail =
                        RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(trimmed);
                    if (!isPhone && !isEmail) {
                      return isAmharic
                          ? 'ትክክለኛ ስልክ ቁጥር ወይም ኢሜይል ያስገቡ።'
                          : 'Enter a valid phone number or email.';
                    }
                    return null;
                  },
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
                            final identifier =
                                _identifierController.text.trim();

                            try {
                              final options =
                                  await services.authApi.getPinRecoveryOptions(
                                identifier: identifier,
                              );

                              if (!context.mounted) {
                                return;
                              }

                              if (options.channels.isEmpty) {
                                setState(() {
                                  _submitting = false;
                                  _message = isAmharic
                                      ? 'ለዚህ መለያ የOTP መላኪያ አማራጭ አልተገኘም።'
                                      : 'No OTP recovery channel is available for this account.';
                                });
                                return;
                              }

                              RecoveryChannelOption selectedChannel;
                              if (options.channels.length == 1) {
                                selectedChannel = options.channels.first;
                              } else {
                                final selection = await _selectRecoveryChannel(
                                  context,
                                  isAmharic: isAmharic,
                                  channels: options.channels,
                                );
                                if (selection == null) {
                                  setState(() {
                                    _submitting = false;
                                  });
                                  return;
                                }
                                selectedChannel = selection;
                              }

                              final otpResult =
                                  await services.authApi.requestOtp(
                                phoneNumber: options.phoneNumber,
                                preferredChannel: selectedChannel.channel,
                                purpose: 'pin_recovery',
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
                                    phoneNumber: options.phoneNumber,
                                    deliveryChannel:
                                        otpResult['deliveryChannel']
                                                as String? ??
                                            selectedChannel.channel,
                                    maskedDestination:
                                        otpResult['maskedDestination']
                                                as String? ??
                                            selectedChannel.maskedDestination,
                                    recoveryMode: OtpRecoveryMode.forgotPin,
                                  ),
                                ),
                              );
                            } catch (error) {
                              if (!mounted) {
                                return;
                              }
                              setState(() {
                                _submitting = false;
                                _message = error
                                    .toString()
                                    .replaceFirst('Exception: ', '');
                              });
                            }
                          },
                    child: Text(
                      _submitting
                          ? (isAmharic ? 'በሂደት ላይ...' : 'Please wait...')
                          : (isAmharic ? 'ቀጥል' : 'Continue'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<RecoveryChannelOption?> _selectRecoveryChannel(
    BuildContext context, {
    required bool isAmharic,
    required List<RecoveryChannelOption> channels,
  }) {
    return showModalBottomSheet<RecoveryChannelOption>(
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
                  isAmharic ? 'የOTP መቀበያ አማራጭ ይምረጡ' : 'Choose OTP destination',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  isAmharic
                      ? 'በመለያዎ ላይ የተመዘገቡ አማራጮች ብቻ ይታያሉ።'
                      : 'Only the recovery channels already saved on your account are shown here.',
                ),
                const SizedBox(height: 20),
                ...channels.map(
                  (option) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _RecoveryChannelTile(
                      title: option.channel == 'email'
                          ? (isAmharic
                              ? 'OTP ወደ ኢሜይል አድራሻ ላክ'
                              : 'Send OTP to email address')
                          : (isAmharic
                              ? 'OTP ወደ ስልክ ቁጥር ላክ'
                              : 'Send OTP to phone number'),
                      subtitle: option.maskedDestination,
                      icon: option.channel == 'email'
                          ? Icons.email_outlined
                          : Icons.sms_outlined,
                      onTap: () => Navigator.of(sheetContext).pop(option),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _RecoveryChannelTile extends StatelessWidget {
  const _RecoveryChannelTile({
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
