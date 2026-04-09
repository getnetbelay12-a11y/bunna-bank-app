import 'dart:async';

import 'package:flutter/foundation.dart';

import '../core/models/member_session.dart';
import '../core/models/login_challenge.dart';
import '../core/services/app_services.dart';
import '../core/services/native_push_bridge.dart';

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

  static const Duration _sessionTimeout = Duration(hours: 8);
  static const String _appVersion = '0.1.0';

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
      unawaited(_registerDeviceTokenForSession(_session!));
      _startSessionTimeout();
    } catch (error) {
      _authError = _resolveAuthError(
        error,
        fallback: 'PIN verification failed. Try again.',
      );
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
      unawaited(_registerDeviceTokenForSession(_session!));
      _startSessionTimeout();
    } catch (error) {
      _authError = _resolveAuthError(
        error,
        fallback: 'Unable to sign in. Check your credentials and try again.',
      );
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

  void setPreviewSession(MemberSession session) {
    _session = session;
    _authError = null;
    unawaited(_registerDeviceTokenForSession(session));
    _startSessionTimeout();
    notifyListeners();
  }

  Future<void> restoreSession() async {
    await services.sessionStore.load();
    final restoredSession = await services.authApi.restoreSession();
    if (restoredSession == null) {
      return;
    }

    _session = restoredSession;
    _authError = null;
    _startSessionTimeout();
    notifyListeners();
  }

  void _startSessionTimeout() {
    _sessionTimer?.cancel();
    _sessionTimer = Timer(_sessionTimeout, logout);
  }

  Future<void> _registerDeviceTokenForSession(MemberSession session) async {
    final platform =
        defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
    final deviceId = 'device-$platform-${session.customerId.toLowerCase()}';
    final token = _resolvePushToken(
      await NativePushBridge.requestPushToken(),
      platform: platform,
    );

    if (token == null) {
      return;
    }

    try {
      await services.notificationApi.registerDeviceToken(
        deviceId: deviceId,
        platform: platform,
        token: token,
        appVersion: _appVersion,
      );
    } catch (_) {
      // Keep login resilient when push registration fails.
    }
  }

  Future<void> registerNativePushToken(String token) async {
    final session = _session;
    if (session == null) {
      return;
    }

    final platform =
        defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
    final normalizedToken = _resolvePushToken(token, platform: platform);
    if (normalizedToken == null) {
      return;
    }

    final deviceId = 'device-$platform-${session.customerId.toLowerCase()}';

    try {
      await services.notificationApi.registerDeviceToken(
        deviceId: deviceId,
        platform: platform,
        token: normalizedToken,
        appVersion: _appVersion,
      );
    } catch (_) {
      // Keep app flow resilient when late push token sync fails.
    }
  }

  @override
  void dispose() {
    _sessionTimer?.cancel();
    super.dispose();
  }
}

String? _resolvePushToken(
  String? candidate, {
  required String platform,
}) {
  final normalized = candidate?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }

  if (platform == 'ios' && normalized == 'ios-simulator') {
    return normalized;
  }

  if (normalized.startsWith('push-$platform-')) {
    return null;
  }

  return normalized;
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
