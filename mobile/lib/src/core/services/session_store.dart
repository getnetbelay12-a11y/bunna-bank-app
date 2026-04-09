import 'package:shared_preferences/shared_preferences.dart';

class SessionStore {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  String? _accessToken;
  String? _refreshToken;
  SharedPreferences? _prefs;
  Future<void>? _loadFuture;
  final Map<String, Object?> _cache = {};

  String? get accessToken => _accessToken;
  set accessToken(String? value) {
    _accessToken = value;
    _persistString(_accessTokenKey, value);
  }

  String? get refreshToken => _refreshToken;
  set refreshToken(String? value) {
    _refreshToken = value;
    _persistString(_refreshTokenKey, value);
  }

  Future<void> load() {
    return _loadFuture ??= _loadFromPrefs();
  }

  void clear() {
    accessToken = null;
    refreshToken = null;
    _cache.clear();
  }

  void writeCache(String key, Object? value) {
    _cache[key] = value;
  }

  Object? readCache(String key) => _cache[key];

  Future<void> _loadFromPrefs() async {
    try {
      _prefs = await SharedPreferences.getInstance();
      _accessToken = _prefs?.getString(_accessTokenKey);
      _refreshToken = _prefs?.getString(_refreshTokenKey);
    } catch (_) {
      _prefs = null;
    }
  }

  void _persistString(String key, String? value) {
    final prefs = _prefs;
    if (prefs == null) {
      return;
    }

    if (value == null || value.isEmpty) {
      prefs.remove(key);
      return;
    }

    prefs.setString(key, value);
  }
}
