import 'package:flutter/material.dart';

import '../../../app/app_controller.dart';
import '../../../app/app_scope.dart';

class EnterPinScreen extends StatefulWidget {
  const EnterPinScreen({
    super.key,
    required this.challengeId,
    required this.identifier,
  });

  static const routeName = '/enter-pin';

  final String challengeId;
  final String identifier;

  @override
  State<EnterPinScreen> createState() => _EnterPinScreenState();
}

class _EnterPinScreenState extends State<EnterPinScreen> {
  final _formKey = GlobalKey<FormState>();
  final _pinController = TextEditingController(text: '1234');
  bool _rememberDevice = true;

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final isAmharic = controller.language == AppLanguage.amharic;

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(isAmharic ? 'ፒን አስገባ' : 'Enter PIN'),
      ),
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
                  isAmharic ? 'ደህንነቱ የተጠበቀ መግቢያ' : 'Secure sign in',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  isAmharic
                      ? 'ለ ${widget.identifier} ፒን ያስገቡ'
                      : 'Enter the PIN linked to ${widget.identifier}.',
                ),
                const SizedBox(height: 20),
                if (controller.authError != null) ...[
                  Text(
                    controller.authError!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                TextFormField(
                  controller: _pinController,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  maxLength: 6,
                  decoration:
                      InputDecoration(labelText: isAmharic ? 'ፒን' : 'PIN'),
                  validator: (value) => (value == null || value.trim().isEmpty)
                      ? 'PIN is required.'
                      : null,
                ),
                SwitchListTile(
                  value: _rememberDevice,
                  contentPadding: EdgeInsets.zero,
                  onChanged: (value) => setState(() => _rememberDevice = value),
                  title: Text(isAmharic ? 'መሣሪያውን አስታውስ' : 'Remember device'),
                ),
                OutlinedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Biometric login placeholder is enabled for future setup.',
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.fingerprint_rounded),
                  label: Text(isAmharic ? 'ባዮሜትሪክ' : 'Use biometric login'),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () async {
                      if (!_formKey.currentState!.validate()) {
                        return;
                      }

                      final navigator = Navigator.of(context);
                      try {
                        await controller.verifyPin(
                          challengeId: widget.challengeId,
                          pin: _pinController.text.trim(),
                          rememberDevice: _rememberDevice,
                          biometricEnabled: controller.biometricEnabled,
                          deviceId: 'mobile-device-1',
                        );
                        if (!context.mounted) {
                          return;
                        }
                        navigator.popUntil((route) => route.isFirst);
                      } catch (_) {
                        if (!context.mounted) {
                          return;
                        }
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              controller.authError ??
                                  'PIN verification failed. Try again.',
                            ),
                          ),
                        );
                      }
                    },
                    child: Text(isAmharic ? 'ግባ' : 'Sign In'),
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
