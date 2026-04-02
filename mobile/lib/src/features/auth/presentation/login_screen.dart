import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';
import '../../../../widgets/cbe_bank_logo.dart';
import '../../../app/app_controller.dart';
import '../../../app/app_scope.dart';
import '../../../core/services/api_config.dart';
import 'create_account_screen.dart';
import 'enter_pin_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  static const routeName = '/login';

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController(
    text: ApiConfig.demoModeEnabled ? '0911000001' : '',
  );

  @override
  void dispose() {
    _identifierController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final theme = Theme.of(context);
    final isAmharic = controller.language == AppLanguage.amharic;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            24,
            24,
            24,
            24 + MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x14000000),
                        blurRadius: 18,
                        offset: Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: controller.toggleLanguage,
                          child: Text(isAmharic ? 'English' : 'አማርኛ'),
                        ),
                      ),
                      const Center(child: CbeBankLogo(width: 128)),
                      const SizedBox(height: 12),
                      Center(
                        child: Text(
                          isAmharic ? 'ቡና ባንክ' : 'Bunna Bank',
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Center(
                        child: Text(
                          isAmharic
                              ? 'ለአባላት አገልግሎት ቀላል እና ደህንነቱ የተጠበቀ መግቢያ'
                              : 'Simple secure access for membership services',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      Text(
                        isAmharic
                            ? 'ስልክ ቁጥር / ደንበኛ መለያ'
                            : 'Phone Number / Customer ID',
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _identifierController,
                        decoration: const InputDecoration(
                          hintText: '0911xxxxxx / CUST-1001 / MBR-1001',
                        ),
                        validator: (value) =>
                            (value == null || value.trim().isEmpty)
                                ? 'Phone number or customer ID is required.'
                                : null,
                      ),
                      if (ApiConfig.demoModeEnabled) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Demo login: 0911000001, 0900000001, CUST-1001, or MBR-1001',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                      const SizedBox(height: 18),
                      if (controller.authError != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            controller.authError!,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                        ),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: controller.isAuthenticating
                              ? null
                              : () async {
                                  if (!_formKey.currentState!.validate()) {
                                    return;
                                  }

                                  final navigator = Navigator.of(context);
                                  try {
                                    final challenge =
                                        await controller.startLogin(
                                      identifier:
                                          _identifierController.text.trim(),
                                      deviceId: 'mobile-device-1',
                                    );
                                    if (!context.mounted) {
                                      return;
                                    }
                                    navigator.push(
                                      MaterialPageRoute<void>(
                                        builder: (_) => EnterPinScreen(
                                          challengeId: challenge.challengeId,
                                          identifier:
                                              _identifierController.text.trim(),
                                        ),
                                      ),
                                    );
                                  } catch (_) {}
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: cbeBlue,
                          ),
                          child: Text(
                            controller.isAuthenticating
                                ? (isAmharic ? 'በሂደት ላይ...' : 'Please wait...')
                                : (isAmharic ? 'ቀጥል' : 'Continue'),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        alignment: WrapAlignment.spaceBetween,
                        runSpacing: 4,
                        children: [
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) => const CreateAccountScreen(),
                                ),
                              );
                            },
                            child:
                                Text(isAmharic ? 'መለያ ፍጠር' : 'Create Account'),
                          ),
                          TextButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Forgot PIN recovery will use OTP verification.',
                                  ),
                                ),
                              );
                            },
                            child: Text(isAmharic ? 'ፒን ረሳሁ' : 'Forgot PIN'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
