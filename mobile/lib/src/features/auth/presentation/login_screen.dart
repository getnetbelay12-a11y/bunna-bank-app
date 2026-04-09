import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../../widgets/bunna_bank_logo_compat.dart';
import '../../../app/app_controller.dart';
import '../../../app/app_scope.dart';
import 'create_account_screen.dart';
import 'forgot_pin_recovery_screen.dart';
import 'enter_pin_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  static const routeName = '/login';

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController(text: 'BUN-100001');

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
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [abaySurfaceAlt, abayBackground, abayAccentSoft],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              24,
              24,
              24,
              24 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Form(
                  key: _formKey,
                  child: Container(
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.96),
                      borderRadius: BorderRadius.circular(32),
                      border: Border.all(
                        color: abayPrimary.withValues(alpha: 0.10),
                      ),
                      boxShadow: const [
                        BoxShadow(
                          color: abayShadow,
                          blurRadius: 26,
                          offset: Offset(0, 18),
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
                        Center(
                          child: Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: abaySurfaceTint,
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: const BunnaBankLogo(width: 118),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: abayAccentSoft,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            isAmharic
                                ? 'የዲጂታል ባንክ መግቢያ'
                                : 'Digital Banking Access',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: abayPrimaryDeep,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          isAmharic ? 'አማራ ባንክ' : 'Bunna Bank',
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          isAmharic
                              ? 'ለአባላት አገልግሎት ቀላል እና ደህንነቱ የተጠበቀ መግቢያ'
                              : 'Simple secure access for membership services',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: abayMutedText,
                            height: 1.45,
                          ),
                        ),
                        const SizedBox(height: 18),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [abayPrimary, abayPrimaryDark],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(22),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.verified_user_rounded,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  isAmharic
                                      ? 'ደህንነቱ የተጠበቀ የአባል ማረጋገጫ እና የአካውንት አገልግሎቶች'
                                      : 'Secure member sign-in for accounts, loans, support, and updates.',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
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
                            hintText: '0911xxxxxx / BUN-100001',
                          ),
                          validator: (value) =>
                              (value == null || value.trim().isEmpty)
                                  ? 'Phone number or customer ID is required.'
                                  : null,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Use a seeded login such as BUN-100001 or 0911000001',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: abayMutedText,
                          ),
                        ),
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
                                            identifier: _identifierController
                                                .text
                                                .trim(),
                                          ),
                                        ),
                                      );
                                    } catch (_) {}
                                  },
                            child: Text(
                              controller.isAuthenticating
                                  ? (isAmharic
                                      ? 'በሂደት ላይ...'
                                      : 'Please wait...')
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
                              child: Text(
                                  isAmharic ? 'መለያ ፍጠር' : 'Create Account'),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) =>
                                        const ForgotPinRecoveryScreen(),
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
      ),
    );
  }
}
