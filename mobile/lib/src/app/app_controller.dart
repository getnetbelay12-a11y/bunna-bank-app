import 'dart:async';

import 'package:flutter/foundation.dart';

import '../core/models/member_session.dart';
import '../core/models/login_challenge.dart';
import '../core/services/app_services.dart';

enum AppLanguage { english, amharic }

class AppController extends ChangeNotifier {
  AppController({
    required this.services,
  });

  final AppServices services;

  MemberSession? _session;
  bool _isAuthenticating = false;
  String? _authError;
  bool _pinEnabled = true;
  bool _biometricEnabled = false;
  Timer? _sessionTimer;
  AppLanguage _language = AppLanguage.english;

  static const Duration _sessionTimeout = Duration(minutes: 15);

  MemberSession? get session => _session;
  bool get isAuthenticating => _isAuthenticating;
  String? get authError => _authError;
  bool get pinEnabled => _pinEnabled;
  bool get biometricEnabled => _biometricEnabled;
  AppLanguage get language => _language;

  Future<LoginChallenge> startLogin({
    required String identifier,
    String? deviceId,
  }) async {
    _isAuthenticating = true;
    _authError = null;
    notifyListeners();

    try {
      return await services.authApi.startLogin(
        identifier: identifier,
        deviceId: deviceId,
      );
    } catch (error) {
      _authError = _resolveAuthError(
        error,
        fallback:
            'Unable to start login. Check your phone number or customer ID.',
      );
      rethrow;
    } finally {
      _isAuthenticating = false;
      notifyListeners();
    }
  }

  Future<void> verifyPin({
    required String challengeId,
    required String pin,
    bool rememberDevice = false,
    bool biometricEnabled = false,
    String? deviceId,
  }) async {
    _isAuthenticating = true;
    _authError = null;
    notifyListeners();

    try {
      _session = await services.authApi.verifyPin(
        challengeId: challengeId,
        pin: pin,
        rememberDevice: rememberDevice,
        biometricEnabled: biometricEnabled,
        deviceId: deviceId,
      );
      _startSessionTimeout();
    } catch (_) {
      _authError = 'PIN verification failed. Try again.';
      rethrow;
    } finally {
      _isAuthenticating = false;
      notifyListeners();
    }
  }

  Future<void> login({
    required String customerId,
    required String password,
  }) async {
    _isAuthenticating = true;
    _authError = null;
    notifyListeners();

    try {
      _session = await services.authApi.login(
        customerId: customerId,
        password: password,
      );
      _startSessionTimeout();
    } catch (_) {
      _authError = 'Unable to sign in. Check your credentials and try again.';
    } finally {
      _isAuthenticating = false;
      notifyListeners();
    }
  }

  void logout() {
    _sessionTimer?.cancel();
    unawaited(services.authApi.logout());
    services.clearSession();
    _session = null;
    _authError = null;
    notifyListeners();
  }

  void markInteraction() {
    if (_session != null) {
      _startSessionTimeout();
    }
  }

  void togglePin(bool enabled) {
    _pinEnabled = enabled;
    notifyListeners();
  }

  void toggleBiometric(bool enabled) {
    _biometricEnabled = enabled;
    notifyListeners();
  }

  void toggleLanguage() {
    _language = _language == AppLanguage.english
        ? AppLanguage.amharic
        : AppLanguage.english;
    notifyListeners();
  }

  void _startSessionTimeout() {
    _sessionTimer?.cancel();
    _sessionTimer = Timer(_sessionTimeout, logout);
  }

  @override
  void dispose() {
    _sessionTimer?.cancel();
    super.dispose();
  }
}

String _resolveAuthError(Object error, {required String fallback}) {
  final message = error.toString().replaceFirst('Exception: ', '').trim();

  if (message.isEmpty) {
    return fallback;
  }

  if (message.contains('Failed host lookup') ||
      message.contains('Connection refused') ||
      message.contains('SocketException')) {
    return 'Unable to reach the server. Check API_BASE_URL and make sure the backend is running.';
  }

  return message;
}
