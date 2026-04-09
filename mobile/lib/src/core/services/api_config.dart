import 'package:flutter/foundation.dart';

class ApiConfig {
  const ApiConfig._();

  static const _rawBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );
  static const _defaultPort = '4000';

  static String get baseUrl {
    if (hasConfiguredBaseUrl) {
      return _normalizeLoopbackHost(configuredBaseUrl);
    }

    return _platformDefaultBaseUrl();
  }

  static String get configuredBaseUrl => _rawBaseUrl.trim();

  static bool get hasConfiguredBaseUrl => configuredBaseUrl.isNotEmpty;

  static bool get hasBaseUrl => true;

  static String _platformDefaultBaseUrl() {
    if (kIsWeb) {
      return 'http://127.0.0.1:$_defaultPort';
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:$_defaultPort';
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
        return 'http://127.0.0.1:$_defaultPort';
      case TargetPlatform.fuchsia:
        return 'http://127.0.0.1:$_defaultPort';
    }
  }

  static String _normalizeLoopbackHost(String url) {
    if (kIsWeb) {
      return url;
    }

    final uri = Uri.tryParse(url);
    if (uri == null || !uri.hasAuthority) {
      return url;
    }

    final host = uri.host.toLowerCase();
    if (defaultTargetPlatform == TargetPlatform.android &&
        (host == 'localhost' || host == '127.0.0.1')) {
      return uri.replace(host: '10.0.2.2').toString();
    }

    if (defaultTargetPlatform == TargetPlatform.iOS &&
        host == 'localhost') {
      return uri.replace(host: '127.0.0.1').toString();
    }

    return url;
  }
}
