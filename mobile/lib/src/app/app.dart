import 'dart:async';

import 'package:flutter/material.dart';

import '../core/services/app_services.dart';
import '../core/models/member_session.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/create_account_screen.dart';
import '../features/auth/presentation/forgot_pin_recovery_screen.dart';
import '../features/auth/presentation/reset_pin_screen.dart';
import '../features/auth/presentation/enter_pin_screen.dart';
import '../features/auth/presentation/kyc_onboarding_screen.dart';
import '../features/navigation/presentation/member_shell.dart';
import '../features/auth/presentation/otp_verification_screen.dart';
import '../features/splash/presentation/splash_screen.dart';
import 'app_controller.dart';
import 'app_scope.dart';
import '../core/services/native_push_bridge.dart';
import '../../theme/amhara_brand_theme.dart';

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

class BunnaBankApp extends StatelessWidget {
  const BunnaBankApp({
    super.key,
    this.services,
  });

  final AppServices? services;

  @override
  Widget build(BuildContext context) {
    final controller = AppController(services: services ?? AppServices.create());

    return AppScope(
      controller: controller,
      child: MaterialApp(
        navigatorKey: rootNavigatorKey,
        debugShowCheckedModeBanner: false,
        title: 'Bunna Bank',
        theme: amharaBrandTheme,
        home: _StartupGate(controller: controller),
        routes: {
          LoginScreen.routeName: (_) => const LoginScreen(),
          CreateAccountScreen.routeName: (_) => const CreateAccountScreen(),
          EnterPinScreen.routeName: (_) => const EnterPinScreen(
              challengeId: 'demo', identifier: 'BUN-100001'),
          OtpVerificationScreen.routeName: (_) => const OtpVerificationScreen(
              phoneNumber: '0911000001',
              deliveryChannel: 'sms',
              maskedDestination: '09******01'),
          ForgotPinRecoveryScreen.routeName: (_) =>
              const ForgotPinRecoveryScreen(),
          ResetPinScreen.routeName: (_) =>
              const ResetPinScreen(phoneNumber: '0911000001'),
          KycOnboardingScreen.routeName: (_) =>
              const KycOnboardingScreen(phoneNumber: '0911000001'),
        },
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
    unawaited(_initializeSession());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      NativePushBridge.initialize(
        navigatorKey: rootNavigatorKey,
        notificationApi: widget.controller.services.notificationApi,
        onPushTokenUpdated: widget.controller.registerNativePushToken,
      );
    });
    Future<void>.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted) {
        return;
      }

      setState(() {
        _ready = true;
      });
    });
  }

  Future<void> _initializeSession() async {
    _applyPreviewSession();
    await widget.controller.restoreSession();
  }

  void _applyPreviewSession() {
    final preview = Uri.base.queryParameters['preview'];

    if (preview != 'customer') {
      return;
    }

    widget.controller.setPreviewSession(
      const MemberSession(
        memberId: 'meseret-alemu',
        customerId: 'BUN-100003',
        fullName: 'Meseret Alemu',
        phone: '0911000002',
        memberType: MemberType.member,
        branchName: 'Gondar Branch',
        membershipStatus: 'pending_verification',
        identityVerificationStatus: 'manual_review_required',
        featureFlags: MemberFeatureFlags.defaults(
          voting: false,
          announcements: false,
          dividends: false,
          schoolPayment: true,
          loans: true,
          savings: true,
          liveChat: true,
        ),
      ),
    );
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
