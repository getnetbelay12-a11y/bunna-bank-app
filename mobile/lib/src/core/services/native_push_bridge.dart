import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../features/notifications/presentation/notification_navigation.dart';
import 'api_contracts.dart';

class NativePushBridge {
  NativePushBridge._();

  static const MethodChannel _channel = MethodChannel(
    'com.getnetbelay.bunnaBankMobile/push',
  );

  static GlobalKey<NavigatorState>? _navigatorKey;
  static NotificationApi? _notificationApi;
  static Future<void> Function(String token)? _onPushTokenUpdated;
  static String? _pendingDeepLink;
  static String? _pendingNotificationId;
  static bool _initialized = false;

  static Future<void> initialize({
    required GlobalKey<NavigatorState> navigatorKey,
    required NotificationApi notificationApi,
    Future<void> Function(String token)? onPushTokenUpdated,
  }) async {
    _navigatorKey = navigatorKey;
    _notificationApi = notificationApi;
    _onPushTokenUpdated = onPushTokenUpdated;

    if (_initialized) {
      await _drainPendingNotification();
      return;
    }

    _initialized = true;
    _channel.setMethodCallHandler(_handleNativeMethodCall);

    try {
      final payload =
          await _channel.invokeMapMethod<dynamic, dynamic>('consumeLaunchNotification');
      _capturePayload(payload);
      await _drainPendingNotification();
    } on MissingPluginException {
      // Desktop tests and non-iOS builds do not expose the native bridge.
    } catch (_) {
      // Ignore launch payload failures. App navigation should stay resilient.
    }
  }

  static Future<String?> requestPushToken() async {
    if (kIsWeb) {
      return null;
    }

    if (defaultTargetPlatform != TargetPlatform.iOS) {
      return null;
    }

    try {
      await _channel.invokeMethod('requestPermissions');
      return await _channel.invokeMethod<String>('getPushToken');
    } on MissingPluginException {
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<dynamic> _handleNativeMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'notificationTap':
        _capturePayload(call.arguments as Map<dynamic, dynamic>?);
        await _drainPendingNotification();
        break;
      case 'pushTokenUpdated':
        final token = call.arguments?.toString().trim();
        if (token != null && token.isNotEmpty && _onPushTokenUpdated != null) {
          await _onPushTokenUpdated!(token);
        }
        break;
    }
  }

  static void _capturePayload(Map<dynamic, dynamic>? payload) {
    if (payload == null) {
      return;
    }

    final deepLink = payload['deepLink']?.toString();
    final notificationId = payload['notificationId']?.toString();

    if (deepLink != null && deepLink.isNotEmpty) {
      _pendingDeepLink = deepLink;
    }

    if (notificationId != null && notificationId.isNotEmpty) {
      _pendingNotificationId = notificationId;
    }
  }

  static Future<void> _drainPendingNotification() async {
    final navigator = _navigatorKey?.currentState;
    final deepLink = _pendingDeepLink;

    if (navigator == null || deepLink == null || deepLink.isEmpty) {
      return;
    }

    final notificationId = _pendingNotificationId;
    _pendingDeepLink = null;
    _pendingNotificationId = null;

    if (notificationId != null && _notificationApi != null) {
      try {
        await _notificationApi!.markAsRead(notificationId);
      } catch (_) {
        // Allow navigation even when the read marker fails.
      }
    }

    await openNotificationDeepLink(navigator, deepLink);
  }
}
