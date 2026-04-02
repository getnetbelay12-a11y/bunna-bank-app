class SessionStore {
  String? accessToken;
  String? refreshToken;
  final Map<String, Object?> _cache = {};

  void clear() {
    accessToken = null;
    refreshToken = null;
    _cache.clear();
  }

  void writeCache(String key, Object? value) {
    _cache[key] = value;
  }

  Object? readCache(String key) => _cache[key];
}
