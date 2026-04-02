import 'package:flutter/material.dart';

import '../../theme/cbe_bank_theme.dart';
import '../core/services/api_config.dart';
import '../core/services/app_services.dart';
import '../features/auth/presentation/create_account_screen.dart';
import '../features/auth/presentation/enter_pin_screen.dart';
import '../features/auth/presentation/kyc_onboarding_screen.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/otp_verification_screen.dart';
import '../features/navigation/presentation/member_shell.dart';
import '../features/splash/presentation/splash_screen.dart';
import 'app_controller.dart';
import 'app_scope.dart';

class CbeBankApp extends StatefulWidget {
  const CbeBankApp({super.key});

  @override
  State<CbeBankApp> createState() => _CbeBankAppState();
}

class _CbeBankAppState extends State<CbeBankApp> {
  AppController? _controller;
  Object? _startupError;

  @override
  void initState() {
    super.initState();
    try {
      _controller = AppController(services: AppServices.create());
    } catch (error) {
      _startupError = error;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_startupError != null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Bunna Bank',
        theme: cbeBankTheme,
        home: _ConfigurationErrorScreen(error: _startupError!),
      );
    }

    final controller = _controller!;

    return AppScope(
      controller: controller,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Bunna Bank',
        theme: cbeBankTheme,
        home: _StartupGate(controller: controller),
        routes: {
          LoginScreen.routeName: (_) => const LoginScreen(),
          CreateAccountScreen.routeName: (_) => const CreateAccountScreen(),
          EnterPinScreen.routeName: (_) => const EnterPinScreen(
              challengeId: 'demo', identifier: '0911000001'),
          OtpVerificationScreen.routeName: (_) =>
              const OtpVerificationScreen(phoneNumber: '0911000001'),
          KycOnboardingScreen.routeName: (_) =>
              const KycOnboardingScreen(phoneNumber: '0911000001'),
        },
      ),
    );
  }
}

class _ConfigurationErrorScreen extends StatelessWidget {
  const _ConfigurationErrorScreen({
    required this.error,
  });

  final Object error;

  @override
  Widget build(BuildContext context) {
    const guidance = ApiConfig.demoModeEnabled
        ? 'Set API_BASE_URL to use the backend, or keep APP_DEMO_MODE enabled for local preview builds.'
        : 'Set API_BASE_URL with --dart-define before building this release.';

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Bunna Bank configuration required',
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                '$error',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                guidance,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StartupGate extends StatefulWidget {
  const _StartupGate({
    required this.controller,
  });

  final AppController controller;

  @override
  State<_StartupGate> createState() => _StartupGateState();
}

class _StartupGateState extends State<_StartupGate> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted) {
        return;
      }

      setState(() {
        _ready = true;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return const SplashScreen();
    }

    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, _) {
        final session = widget.controller.session;

        if (session == null) {
          return const LoginScreen();
        }

        return MemberShell(session: session);
      },
    );
  }
}
