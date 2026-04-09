import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/index.dart';
import 'api_contracts.dart';
import 'session_store.dart';

class HttpAuthApi implements AuthApi {
  HttpAuthApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<LoginChallenge> startLogin({
    required String identifier,
    String? deviceId,
  }) async {
    final normalizedIdentifier = identifier.trim();
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/start-login'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        if (_looksLikePhoneNumber(normalizedIdentifier))
          'phoneNumber': _normalizePhoneNumber(normalizedIdentifier)
        else
          'customerId': normalizedIdentifier,
        if (deviceId != null) 'deviceId': deviceId,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'Start login failed.',
      ));
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return LoginChallenge(
      challengeId: data['challengeId'] as String,
      expiresAt: DateTime.tryParse(data['expiresAt'] as String? ?? '') ??
          DateTime.now().add(const Duration(minutes: 5)),
    );
  }

  @override
  Future<MemberSession> verifyPin({
    required String challengeId,
    required String pin,
    bool rememberDevice = false,
    bool biometricEnabled = false,
    String? deviceId,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/verify-pin'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'challengeId': challengeId,
        'pin': pin,
        'rememberDevice': rememberDevice,
        'biometricEnabled': biometricEnabled,
        if (deviceId != null) 'deviceId': deviceId,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'PIN verification failed.',
      ));
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return _toSession(data);
  }

  @override
  Future<AccountCheckResult> checkExistingAccount({
    required String phoneNumber,
    String? faydaFin,
    String? email,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/check-existing-account'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'phoneNumber': phoneNumber,
        if (faydaFin != null && faydaFin.isNotEmpty) 'faydaFin': faydaFin,
        if (email != null && email.isNotEmpty) 'email': email,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Existing account check failed.');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return AccountCheckResult(
      exists: data['exists'] as bool? ?? false,
      message: data['message'] as String? ?? '',
      matchType: data['matchType'] as String?,
    );
  }

  @override
  Future<RegistrationResult> register({
    required String firstName,
    required String lastName,
    required String phoneNumber,
    String? email,
    required String dateOfBirth,
    required String region,
    required String city,
    String? preferredBranchId,
    String? preferredBranchName,
    required String password,
    required String confirmPassword,
    String? faydaFin,
    String? faydaAlias,
    String? faydaQrData,
    String? faydaFrontImage,
    String? faydaBackImage,
    bool consentAccepted = true,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'firstName': firstName,
        'lastName': lastName,
        'phoneNumber': phoneNumber,
        if (email != null && email.isNotEmpty) 'email': email,
        'dateOfBirth': dateOfBirth,
        'region': region,
        'city': city,
        if (preferredBranchId != null && preferredBranchId.isNotEmpty)
          'preferredBranchId': preferredBranchId,
        if (preferredBranchName != null && preferredBranchName.isNotEmpty)
          'preferredBranchName': preferredBranchName,
        'password': password,
        'confirmPassword': confirmPassword,
        if (faydaFin != null && faydaFin.isNotEmpty) 'faydaFin': faydaFin,
        if (faydaAlias != null && faydaAlias.isNotEmpty)
          'faydaAlias': faydaAlias,
        if (faydaQrData != null && faydaQrData.isNotEmpty)
          'faydaQrData': faydaQrData,
        if (faydaFrontImage != null && faydaFrontImage.isNotEmpty)
          'faydaFrontImage': faydaFrontImage,
        if (faydaBackImage != null && faydaBackImage.isNotEmpty)
          'faydaBackImage': faydaBackImage,
        'consentAccepted': consentAccepted,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'Registration failed.',
      ));
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return RegistrationResult(
      customerId: data['customerId'] as String? ?? '',
      memberId: data['memberId'] as String? ?? '',
      message: data['message'] as String? ?? '',
    );
  }

  @override
  Future<MemberSession> login({
    required String customerId,
    required String password,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/member/login'),
      headers: const {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'customerId': customerId,
        'password': password,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'Member login failed.',
      ));
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return _toSession(data);
  }

  @override
  Future<Map<String, dynamic>> requestOtp({
    required String phoneNumber,
    String? email,
    String preferredChannel = 'sms',
    String? purpose,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/request-otp'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'phoneNumber': phoneNumber,
        if (email != null && email.isNotEmpty) 'email': email,
        'preferredOtpChannel': preferredChannel,
        if (purpose != null && purpose.isNotEmpty) 'purpose': purpose,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('OTP request failed.');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  @override
  Future<Map<String, dynamic>> verifyOtp({
    required String phoneNumber,
    required String otpCode,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/verify-otp'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'phoneNumber': phoneNumber,
        'otpCode': otpCode,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('OTP verification failed.');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  @override
  Future<OnboardingStatus> getOnboardingStatus({
    required String customerId,
    required String phoneNumber,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/onboarding-status'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'customerId': customerId,
        'phoneNumber': phoneNumber,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'Unable to load onboarding status.',
      ));
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return OnboardingStatus(
      customerId: data['customerId'] as String? ?? customerId,
      phoneNumber: data['phoneNumber'] as String? ?? phoneNumber,
      onboardingReviewStatus:
          data['onboardingReviewStatus'] as String? ?? 'submitted',
      membershipStatus:
          data['membershipStatus'] as String? ?? 'pending_verification',
      identityVerificationStatus:
          data['identityVerificationStatus'] as String? ?? 'not_started',
      requiredAction: data['requiredAction'] as String? ?? '',
      statusMessage: data['statusMessage'] as String? ?? '',
      branchName: data['branchName'] as String?,
      reviewNote: data['reviewNote'] as String?,
      lastUpdatedAt: DateTime.tryParse(data['lastUpdatedAt'] as String? ?? ''),
    );
  }

  @override
  Future<Map<String, dynamic>> resetPin({
    required String phoneNumber,
    String? email,
    required String newPin,
    required String confirmPin,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/reset-pin'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'phoneNumber': phoneNumber,
        if (email != null && email.isNotEmpty) 'email': email,
        'newPin': newPin,
        'confirmPin': confirmPin,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'PIN reset failed.',
      ));
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  @override
  Future<PinRecoveryOptions> getPinRecoveryOptions({
    required String identifier,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/recovery-options'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'identifier': identifier}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'Recovery options lookup failed.',
      ));
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final channels = (data['channels'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .map((item) => RecoveryChannelOption(
              channel: item['channel'] as String? ?? 'sms',
              maskedDestination: item['maskedDestination'] as String? ?? '',
            ))
        .toList();

    return PinRecoveryOptions(
      phoneNumber: data['phoneNumber'] as String? ?? identifier,
      channels: channels,
    );
  }

  @override
  Future<void> logout() async {
    await _client.post(
      Uri.parse('$baseUrl/auth/logout'),
      headers: _authHeaders(),
    );
    sessionStore.clear();
  }

  @override
  Future<MemberSession?> restoreSession() async {
    final token = sessionStore.accessToken?.trim();
    if (token == null || token.isEmpty) {
      return null;
    }

    final response = await _client.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: _authHeaders(),
    );

    if (response.statusCode == 401 || response.statusCode == 403) {
      sessionStore.clear();
      return null;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'Session restore failed.',
      ));
    }

    final user = jsonDecode(response.body) as Map<String, dynamic>;
    return _toSession({'user': user});
  }

  String _extractErrorMessage(
    http.Response response, {
      required String fallback,
  }) {
    try {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.trim().isNotEmpty) {
          return message;
        }
        if (message is List && message.isNotEmpty) {
          return message.join(', ');
        }
        final error = data['error'];
        if (error is String && error.trim().isNotEmpty) {
          return '$fallback ($error)';
        }
      }
    } catch (_) {
      // Ignore parse errors and use fallback below.
    }

    return '$fallback (HTTP ${response.statusCode})';
  }

  Map<String, String> _authHeaders() {
    final token = sessionStore.accessToken;

    return {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  MemberSession _toSession(Map<String, dynamic> data) {
    final user = data['user'] as Map<String, dynamic>;
    sessionStore.accessToken =
        data.containsKey('accessToken') ? data['accessToken'] as String? : sessionStore.accessToken;
    sessionStore.refreshToken =
        data.containsKey('refreshToken') ? data['refreshToken'] as String? : sessionStore.refreshToken;

    return MemberSession(
      memberId: user['id'] as String,
      customerId: user['customerId'] as String? ??
          user['memberNumber'] as String? ??
          '',
      fullName: user['fullName'] as String? ?? 'Member',
      phone: user['phone'] as String? ?? '',
      memberType: user['memberType'] == 'shareholder'
          ? MemberType.shareholder
          : MemberType.member,
      branchName: user['branchName'] as String? ??
          buildBranchLabel(user['branchId'] as String?),
      membershipStatus:
          user['membershipStatus'] as String? ?? 'pending_verification',
      identityVerificationStatus:
          user['identityVerificationStatus'] as String? ?? 'not_started',
      featureFlags: MemberFeatureFlags(
        voting: (user['featureFlags'] as Map<String, dynamic>?)?['voting']
                as bool? ??
            false,
        announcements: (user['featureFlags']
                as Map<String, dynamic>?)?['announcements'] as bool? ??
            false,
        dividends: (user['featureFlags'] as Map<String, dynamic>?)?['dividends']
                as bool? ??
            false,
        schoolPayment: (user['featureFlags']
                as Map<String, dynamic>?)?['schoolPayment'] as bool? ??
            true,
        loans: (user['featureFlags'] as Map<String, dynamic>?)?['loans']
                as bool? ??
            true,
        savings: (user['featureFlags'] as Map<String, dynamic>?)?['savings']
                as bool? ??
            true,
        liveChat: (user['featureFlags'] as Map<String, dynamic>?)?['liveChat']
                as bool? ??
            true,
      ),
    );
  }

  bool _looksLikePhoneNumber(String value) {
    final digitsOnly = value.replaceAll(RegExp(r'\D'), '');
    return digitsOnly.length >= 10 &&
        (value.startsWith('09') ||
            value.startsWith('+251') ||
            value.startsWith('251') ||
            RegExp(r'^\d+$').hasMatch(value));
  }

  String _normalizePhoneNumber(String value) {
    final digitsOnly = value.replaceAll(RegExp(r'\D'), '');

    if (digitsOnly.startsWith('251') && digitsOnly.length == 12) {
      return '0${digitsOnly.substring(3)}';
    }

    if (digitsOnly.length == 9 && !digitsOnly.startsWith('0')) {
      return '0$digitsOnly';
    }

    return digitsOnly;
  }
}

class HttpLocationApi implements LocationApi {
  HttpLocationApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<List<String>> fetchRegions() async {
    final response = await _client.get(Uri.parse('$baseUrl/locations/regions'));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to load regions.');
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data
        .map((item) => (item as Map<String, dynamic>)['name'] as String)
        .toList();
  }

  @override
  Future<List<String>> fetchCities(String region) async {
    final response = await _client.get(
      Uri.parse(
          '$baseUrl/locations/cities?region=${Uri.encodeQueryComponent(region)}'),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to load cities.');
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data
        .map((item) => (item as Map<String, dynamic>)['name'] as String)
        .toList();
  }

  @override
  Future<List<LocationBranchOption>> fetchBranches({
    required String region,
    required String city,
  }) async {
    final response = await _client.get(
      Uri.parse(
        '$baseUrl/locations/branches?region=${Uri.encodeQueryComponent(region)}&city=${Uri.encodeQueryComponent(city)}',
      ),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to load branches.');
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data
        .map(
          (item) => LocationBranchOption(
            id: (item as Map<String, dynamic>)['id'] as String,
            name: item['name'] as String,
            region: item['region'] as String? ?? region,
            city: item['city'] as String? ?? city,
          ),
        )
        .toList();
  }
}

class HttpDocumentUploadApi implements DocumentUploadApi {
  HttpDocumentUploadApi({
    required this.baseUrl,
    required this.sessionStore,
  });

  final String baseUrl;
  final SessionStore sessionStore;

  @override
  Future<UploadedDocument> uploadDocument({
    required String filePath,
    required String originalFileName,
    required String domain,
    String? entityId,
    String? documentType,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/uploads/documents'),
    );
    if (sessionStore.accessToken != null &&
        sessionStore.accessToken!.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer ${sessionStore.accessToken}';
    }
    request.fields['domain'] = domain;
    if (entityId != null && entityId.isNotEmpty) {
      request.fields['entityId'] = entityId;
    }
    if (documentType != null && documentType.isNotEmpty) {
      request.fields['documentType'] = documentType;
    }
    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        filePath,
        filename: originalFileName,
      ),
    );

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractUploadErrorMessage(
        response,
        fallback: 'Document upload failed.',
      ));
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return UploadedDocument(
      storageKey: data['storageKey'] as String? ?? '',
      originalFileName: data['originalFileName'] as String? ?? originalFileName,
      provider: data['provider'] as String? ?? 'local',
      entityId: data['entityId'] as String? ?? (entityId ?? ''),
      mimeType: data['mimeType'] as String?,
      sizeBytes: data['sizeBytes'] as int?,
    );
  }

  String _extractUploadErrorMessage(
    http.Response response, {
    required String fallback,
  }) {
    try {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.trim().isNotEmpty) {
          return message;
        }
        if (message is List && message.isNotEmpty) {
          return message.join(', ');
        }
      }
    } catch (_) {
      // Ignore parse errors and use fallback.
    }

    return '$fallback (HTTP ${response.statusCode})';
  }
}

class HttpMemberApi implements MemberApi {
  HttpMemberApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<MemberProfile> fetchMyProfile(String memberId) async {
    final data = await _request('/members/me') as Map<String, dynamic>;

    return MemberProfile(
      memberId: data['id'] as String? ?? memberId,
      customerId: data['customerId'] as String? ??
          data['memberNumber'] as String? ??
          memberId,
      memberNumber: data['memberNumber'] as String? ?? memberId,
      fullName: data['fullName'] as String? ?? 'Member',
      phone: data['phone'] as String? ?? '',
      branchName: data['branchName'] as String? ??
          buildBranchLabel(data['branchId'] as String?),
      memberType: data['memberType'] as String? ?? 'member',
      membershipStatus:
          data['membershipStatus'] as String? ?? 'pending_verification',
      identityVerificationStatus:
          data['identityVerificationStatus'] as String? ?? 'not_started',
      onboardingReviewStatus:
          data['onboardingReviewStatus'] as String? ?? 'submitted',
      onboardingReviewNote: data['onboardingReviewNote'] as String?,
    );
  }

  Future<Object?> _request(String path) async {
    final response = await _client.get(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (sessionStore.accessToken != null)
          'Authorization': 'Bearer ${sessionStore.accessToken}',
      },
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Member request failed.');
    }

    return jsonDecode(response.body);
  }
}

class HttpShareholderApi implements ShareholderApi {
  HttpShareholderApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<ShareholderProfile> fetchMyShareholderProfile() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/shareholders/me'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Shareholder profile request failed.');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return ShareholderProfile(
      memberId: data['_id'] as String? ?? '',
      shareholderId: data['shareholderId'] as String? ??
          data['memberNumber'] as String? ??
          '',
      memberNumber: data['memberNumber'] as String? ?? '',
      fullName: data['fullName'] as String? ?? 'Shareholder Member',
      phone: data['phone'] as String? ?? '',
      totalShares: (data['shares'] as num?)?.toDouble() ??
          (data['shareBalance'] as num?)?.toDouble() ??
          0,
      status: (data['isActive'] as bool? ?? false) ? 'active' : 'inactive',
      memberSince: DateTime.tryParse(data['createdAt'] as String? ?? ''),
    );
  }

  Map<String, String> _authHeaders() {
    return {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };
  }
}

class HttpRecommendationApi implements RecommendationApi {
  HttpRecommendationApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<List<SmartRecommendation>> fetchMyRecommendations() async {
    final payload = await _request(
      '/recommendations/me',
      method: 'GET',
    ) as Map<String, dynamic>;
    final items = (payload['recommendations'] as List<dynamic>? ?? const []);

    return items
        .map((item) => item as Map<String, dynamic>)
        .map(
          (item) => SmartRecommendation(
            id: item['id'] as String? ?? '',
            type: item['type'] as String? ?? 'service_completion',
            title: item['title'] as String? ?? '',
            description: item['description'] as String? ?? '',
            reason: item['reason'] as String? ?? '',
            badge: item['badge'] as String? ?? 'Recommended',
            actionLabel: item['actionLabel'] as String? ?? 'Open',
            actionRoute: item['actionRoute'] as String? ?? '/',
            status: item['status'] as String? ?? 'new',
            score: (item['score'] as num?)?.toDouble() ?? 0,
          ),
        )
        .toList();
  }

  @override
  Future<void> markViewed(String recommendationId) async {
    await _request('/recommendations/$recommendationId/view', method: 'POST');
  }

  @override
  Future<void> dismiss(String recommendationId) async {
    await _request('/recommendations/$recommendationId/dismiss',
        method: 'POST');
  }

  @override
  Future<void> act(String recommendationId, {bool completed = false}) async {
    await _request(
      '/recommendations/$recommendationId/act',
      method: 'POST',
      body: {
        'completed': completed,
      },
    );
  }

  Future<Object?> _request(
    String path, {
    required String method,
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };

    late http.Response response;
    if (method == 'POST') {
      response = await _client.post(
        uri,
        headers: headers,
        body: body == null ? null : jsonEncode(body),
      );
    } else {
      response = await _client.get(uri, headers: headers);
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Recommendation request failed.');
    }

    if (response.body.isEmpty) {
      return null;
    }

    return jsonDecode(response.body);
  }
}

class HttpInsightApi implements InsightApi {
  HttpInsightApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<SmartInsightFeed> fetchMyInsights() async {
    return _fetch('/insights/me');
  }

  @override
  Future<SmartInsightFeed> fetchMyHomeInsights() async {
    return _fetch('/insights/me/home');
  }

  Future<SmartInsightFeed> _fetch(String path) async {
    final response = await _client.get(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (sessionStore.accessToken != null)
          'Authorization': 'Bearer ${sessionStore.accessToken}',
      },
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Insight request failed.');
    }

    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    final items = (payload['items'] as List<dynamic>? ?? const [])
        .map((item) => item as Map<String, dynamic>)
        .map(
          (item) => SmartInsight(
            id: item['id'] as String? ?? '',
            type: item['type'] as String? ?? 'savings_suggestion',
            priority: item['priority'] as String? ?? 'low',
            title: item['title'] as String? ?? '',
            message: item['message'] as String? ?? '',
            actionLabel: item['actionLabel'] as String? ?? 'Open',
            actionRoute: item['actionRoute'] as String? ?? '/',
            dueAt: DateTime.tryParse(item['dueAt'] as String? ?? ''),
            amount: (item['amount'] as num?)?.toDouble(),
            currency: item['currency'] as String?,
            metadata: (item['metadata'] as Map<String, dynamic>?) ?? const {},
          ),
        )
        .toList();

    return SmartInsightFeed(
      generatedAt: DateTime.tryParse(payload['generatedAt'] as String? ?? '') ??
          DateTime.now(),
      total: payload['total'] as int? ?? items.length,
      urgentCount: payload['urgentCount'] as int? ?? 0,
      items: items,
    );
  }
}

class HttpSavingsApi implements SavingsApi {
  HttpSavingsApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<List<SavingsAccount>> fetchMyAccounts(String memberId) async {
    final data = await _request('/savings/accounts/my') as List<dynamic>;

    return data
        .map((item) => item as Map<String, dynamic>)
        .map(
          (item) => SavingsAccount(
            accountId: item['_id'] as String,
            accountNumber: item['accountNumber'] as String,
            balance: (item['balance'] as num).toDouble(),
            currency: item['currency'] as String? ?? 'ETB',
            isActive: item['isActive'] as bool? ?? true,
          ),
        )
        .toList();
  }

  @override
  Future<List<AccountTransaction>> fetchAccountTransactions(
    String accountId,
  ) async {
    final data = await _request('/savings/accounts/$accountId/transactions')
        as List<dynamic>;

    return data
        .map((item) => item as Map<String, dynamic>)
        .map(
          (item) => AccountTransaction(
            transactionReference: item['transactionReference'] as String,
            type: item['type'] as String? ?? 'transaction',
            channel: item['channel'] as String? ?? 'mobile',
            amount: (item['amount'] as num).toDouble(),
            currency: item['currency'] as String? ?? 'ETB',
            createdAt: DateTime.tryParse(item['createdAt'] as String? ?? '') ??
                DateTime(2026, 1, 1),
            narration: item['narration'] as String?,
          ),
        )
        .toList();
  }

  Future<Object?> _request(String path) async {
    final response = await _client.get(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (sessionStore.accessToken != null)
          'Authorization': 'Bearer ${sessionStore.accessToken}',
      },
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Savings request failed.');
    }

    return jsonDecode(response.body);
  }
}

class HttpSchoolPaymentApi implements SchoolPaymentApi {
  HttpSchoolPaymentApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<List<Map<String, dynamic>>> fetchMyLinkedStudents() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/students/linked/me'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Linked students request failed.');
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data.cast<Map<String, dynamic>>();
  }

  @override
  Future<SchoolPaymentResult> createSchoolPayment({
    required String accountId,
    required String studentId,
    required String schoolName,
    required double amount,
    required String channel,
    String? narration,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/payments/school'),
      headers: _authHeaders(),
      body: jsonEncode({
        'accountId': accountId,
        'studentId': studentId,
        'schoolName': schoolName,
        'amount': amount,
        'channel': channel,
        if (narration != null && narration.isNotEmpty) 'narration': narration,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('School payment failed.');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    return SchoolPaymentResult(
      schoolPaymentId: data['schoolPaymentId'] as String,
      transactionReference: data['transactionReference'] as String,
      notificationStatus: data['notificationStatus'] as String? ?? 'sent',
    );
  }

  @override
  Future<QrPaymentResult> createQrPayment({
    required String accountId,
    required String qrPayload,
    required String merchantName,
    required double amount,
    String? narration,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/payments/qr/scan-pay'),
      headers: _authHeaders(),
      body: jsonEncode({
        'accountId': accountId,
        'qrPayload': qrPayload,
        'merchantName': merchantName,
        'amount': amount,
        if (narration != null && narration.isNotEmpty) 'narration': narration,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('QR payment failed.');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return QrPaymentResult(
      transactionId: data['transactionId'] as String,
      transactionReference: data['transactionReference'] as String,
      notificationStatus: data['notificationStatus'] as String? ?? 'sent',
      merchantName: data['merchantName'] as String,
      amount: (data['amount'] as num).toDouble(),
    );
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMySchoolPayments() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/payments/school/my'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('School payment history failed.');
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data.cast<Map<String, dynamic>>();
  }

  @override
  Future<PaymentActivitySummary?> fetchMyPaymentActivity() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/payments/activity/my'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Payment activity summary failed.');
    }

    if (response.body.trim().isEmpty || response.body.trim() == 'null') {
      return null;
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return PaymentActivitySummary(
      memberId: data['memberId'] as String,
      customerId: data['customerId'] as String,
      memberName: data['memberName'] as String,
      phone: data['phone'] as String?,
      branchName: data['branchName'] as String?,
      openCases: (data['openCases'] as num?)?.toInt() ?? 0,
      totalReceipts: (data['totalReceipts'] as num?)?.toInt() ?? 0,
      qrPayments: (data['qrPayments'] as num?)?.toInt() ?? 0,
      schoolPayments: (data['schoolPayments'] as num?)?.toInt() ?? 0,
      disputeReceipts: (data['disputeReceipts'] as num?)?.toInt() ?? 0,
      latestActivityAt: data['latestActivityAt'] is String
          ? DateTime.tryParse(data['latestActivityAt'] as String)
          : null,
    );
  }

  @override
  Future<List<PaymentReceiptItem>> fetchMyPaymentReceipts() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/payments/receipts/my'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Payment receipt history failed.');
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data
        .cast<Map<String, dynamic>>()
        .map(
          (item) => PaymentReceiptItem(
            receiptId: item['receiptId'] as String,
            receiptType: item['receiptType'] as String,
            sourceId: item['sourceId'] as String,
            title: item['title'] as String,
            description: item['description'] as String,
            status: item['status'] as String,
            amount: (item['amount'] as num?)?.toDouble(),
            currency: item['currency'] as String?,
            transactionReference: item['transactionReference'] as String?,
            counterparty: item['counterparty'] as String?,
            channel: item['channel'] as String?,
            attachments: (item['attachments'] as List<dynamic>? ?? const [])
                .map((entry) => entry.toString())
                .toList(),
            recordedAt: item['recordedAt'] != null
                ? DateTime.tryParse(item['recordedAt'] as String)
                : null,
            metadata: Map<String, dynamic>.from(
              item['metadata'] as Map? ?? const {},
            ),
          ),
        )
        .toList();
  }

  Map<String, String> _authHeaders() {
    return {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };
  }
}

class HttpLoanApi implements LoanApi {
  HttpLoanApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<List<LoanSummary>> fetchMyLoans() async {
    final data = await _get('/loans/my') as List<dynamic>;

    return data
        .map((item) => _toLoanSummary(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<LoanSummary> fetchLoanDetail(String loanId) async {
    final data = await _get('/loans/$loanId') as Map<String, dynamic>;
    return _toLoanSummary(data);
  }

  @override
  Future<List<LoanTimelineItem>> fetchLoanTimeline(String loanId) async {
    final data = await _get('/loans/$loanId/timeline') as Map<String, dynamic>;
    final timeline = data['timeline'] as List<dynamic>? ?? const [];
    return timeline
        .map((item) => _toLoanTimelineItem(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<Map<String, dynamic>> uploadLoanDocument(
    String loanId, {
    required String documentType,
    required String originalFileName,
    String? storageKey,
    String? mimeType,
    int? sizeBytes,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/loans/$loanId/documents'),
      headers: _authHeaders(),
      body: jsonEncode({
        'documentType': documentType,
        'originalFileName': originalFileName,
        if (storageKey != null && storageKey.isNotEmpty)
          'storageKey': storageKey,
        if (mimeType != null && mimeType.isNotEmpty) 'mimeType': mimeType,
        if (sizeBytes != null) 'sizeBytes': sizeBytes,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Loan document upload failed.');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  @override
  Future<LoanSummary> submitLoanApplication({
    required String loanType,
    required double amount,
    required double interestRate,
    required int termMonths,
    required String purpose,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/loans'),
      headers: _authHeaders(),
      body: jsonEncode({
        'loanType': loanType,
        'amount': amount,
        'interestRate': interestRate,
        'termMonths': termMonths,
        'purpose': purpose,
        'documents': const [],
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Loan submission failed.');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return _toLoanSummary(data['loan'] as Map<String, dynamic>);
  }

  Future<Object?> _get(String path) async {
    final response = await _client.get(
      Uri.parse('$baseUrl$path'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Loan request failed.');
    }

    return jsonDecode(response.body);
  }

  LoanSummary _toLoanSummary(Map<String, dynamic> item) {
    return LoanSummary(
      loanId: item['id'] as String,
      loanType: item['loanType'] as String? ?? 'Loan',
      amount: (item['amount'] as num).toDouble(),
      interestRate: (item['interestRate'] as num?)?.toDouble() ?? 0,
      termMonths: item['termMonths'] as int? ?? 12,
      status: item['status'] as String? ?? 'submitted',
      currentLevel: item['currentLevel'] as String? ?? 'branch',
      deficiencyReasons:
          (item['deficiencyReasons'] as List<dynamic>? ?? const [])
              .whereType<String>()
              .toList(),
      purpose: item['purpose'] as String?,
      createdAt: item['createdAt'] == null
          ? null
          : DateTime.tryParse(item['createdAt'] as String),
    );
  }

  LoanTimelineItem _toLoanTimelineItem(Map<String, dynamic> item) {
    final status = item['status'] as String? ?? 'submitted';
    return LoanTimelineItem(
      status: status,
      title: item['title'] as String? ?? status.replaceAll('_', ' '),
      description: item['description'] as String? ??
          'Loan workflow event recorded for this application.',
      isCompleted: item['isCompleted'] as bool? ?? false,
      isCurrent: item['isCurrent'] as bool? ?? false,
    );
  }

  Map<String, String> _authHeaders() {
    return {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };
  }
}

class HttpNotificationApi implements NotificationApi {
  HttpNotificationApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<List<AppNotification>> fetchMyNotifications() async {
    final data = await _get('/notifications/me') as List<dynamic>;

    return data
        .map((item) => _toNotification(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<AppNotification> markAsRead(String notificationId) async {
    final response = await _client.patch(
      Uri.parse('$baseUrl/notifications/$notificationId/read'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Mark as read failed.');
    }

    return _toNotification(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<Object?> _get(String path) async {
    final response = await _client.get(
      Uri.parse('$baseUrl$path'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Notification request failed.');
    }

    return jsonDecode(response.body);
  }

  AppNotification _toNotification(Map<String, dynamic> item) {
    return AppNotification(
      notificationId: item['id'] as String,
      type: item['type'] as String? ?? 'system',
      channel: item['channel'] as String? ?? 'mobile_push',
      status: item['status'] as String? ?? 'sent',
      title: item['title'] as String? ?? 'Notification',
      message: item['message'] as String? ?? '',
      entityType: item['entityType'] as String?,
      entityId: item['entityId'] as String?,
      actionLabel: item['actionLabel'] as String?,
      priority: item['priority'] as String?,
      deepLink: item['deepLink'] as String?,
      createdAt: DateTime.tryParse(item['createdAt'] as String? ?? '') ??
          DateTime(2026, 1, 1),
    );
  }

  @override
  Future<void> registerDeviceToken({
    required String deviceId,
    required String platform,
    required String token,
    required String appVersion,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/notifications/device-tokens/register'),
      headers: _authHeaders(),
      body: jsonEncode({
        'deviceId': deviceId,
        'platform': platform,
        'token': token,
        'appVersion': appVersion,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Device token registration failed.');
    }
  }

  Map<String, String> _authHeaders() {
    return {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };
  }
}

class HttpIdentityVerificationApi implements IdentityVerificationApi {
  HttpIdentityVerificationApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<IdentityVerificationResult> getStatus() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/identity/fayda/status'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Identity status request failed.');
    }

    return _parse(jsonDecode(response.body) as Map<String, dynamic>);
  }

  @override
  Future<IdentityVerificationResult> submitFin({
    required String faydaFin,
    String? faydaAlias,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/identity/fayda/submit-fin'),
      headers: _authHeaders(),
      body: jsonEncode({
        'faydaFin': faydaFin,
        if (faydaAlias != null && faydaAlias.isNotEmpty)
          'faydaAlias': faydaAlias,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('FIN submission failed.');
    }

    return _parse(jsonDecode(response.body) as Map<String, dynamic>);
  }

  @override
  Future<IdentityVerificationResult> uploadQr({
    String? qrDataRaw,
    String? faydaAlias,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/identity/fayda/upload-qr'),
      headers: _authHeaders(),
      body: jsonEncode({
        if (qrDataRaw != null && qrDataRaw.isNotEmpty) 'qrDataRaw': qrDataRaw,
        if (faydaAlias != null && faydaAlias.isNotEmpty)
          'faydaAlias': faydaAlias,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('QR upload failed.');
    }

    return _parse(jsonDecode(response.body) as Map<String, dynamic>);
  }

  @override
  Future<IdentityVerificationResult> verify() async {
    final response = await _client.post(
      Uri.parse('$baseUrl/identity/fayda/verify'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Identity verification failed.');
    }

    return _parse(jsonDecode(response.body) as Map<String, dynamic>);
  }

  IdentityVerificationResult _parse(Map<String, dynamic> data) {
    return IdentityVerificationResult(
      memberId: data['memberId'] as String? ?? '',
      phoneNumber: data['phoneNumber'] as String? ?? '',
      verificationStatus:
          data['verificationStatus'] as String? ?? 'not_started',
      verificationMethod:
          data['verificationMethod'] as String? ?? 'fin_plus_manual_review',
      faydaFin: data['faydaFin'] as String?,
      faydaAlias: data['faydaAlias'] as String?,
      qrDataRaw: data['qrDataRaw'] as String?,
      verificationReference: data['verificationReference'] as String?,
      failureReason: data['failureReason'] as String?,
    );
  }

  Map<String, String> _authHeaders() {
    return {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };
  }
}

class HttpChatApi implements ChatApi {
  HttpChatApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<ChatConversation> createConversation({
    required String issueCategory,
    String? loanId,
    String? initialMessage,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/support/chats'),
      headers: _authHeaders(),
      body: jsonEncode({
        'issueCategory': issueCategory,
        if (loanId != null && loanId.isNotEmpty) 'loanId': loanId,
        if (initialMessage != null && initialMessage.isNotEmpty)
          'initialMessage': initialMessage,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'Chat conversation creation failed.',
      ));
    }

    return _parseConversation(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  @override
  Future<ChatConversation> fetchConversation(String conversationId) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/support/chats/$conversationId'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'Chat conversation request failed.',
      ));
    }

    return _parseConversation(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  @override
  Future<List<ChatConversation>> fetchMyConversations() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/support/chats/me'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'Chat conversations request failed.',
      ));
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data
        .map((item) => _parseConversation(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<ChatConversation> sendMessage(
    String conversationId, {
    required String message,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/support/chats/$conversationId/messages'),
      headers: _authHeaders(),
      body: jsonEncode({'message': message}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractErrorMessage(
        response,
        fallback: 'Chat message send failed.',
      ));
    }

    return _parseConversation(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  String _extractErrorMessage(
    http.Response response, {
    required String fallback,
  }) {
    try {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.trim().isNotEmpty) {
          return message;
        }
        if (message is List && message.isNotEmpty) {
          return message.join(', ');
        }
        final error = data['error'];
        if (error is String && error.trim().isNotEmpty) {
          return '$fallback ($error)';
        }
      }
    } catch (_) {
      // Ignore parse errors and return the fallback with status context.
    }

    return '$fallback (HTTP ${response.statusCode})';
  }

  ChatConversation _parseConversation(Map<String, dynamic> json) {
    ChatMessage? parseMessage(Map<String, dynamic>? value) {
      if (value == null) {
        return null;
      }

      return ChatMessage(
        id: value['id'] as String? ?? '',
        conversationId: value['conversationId'] as String? ?? '',
        senderType: value['senderType'] as String? ?? 'system',
        senderId: value['senderId'] as String?,
        senderName: value['senderName'] as String?,
        message: value['message'] as String? ?? '',
        messageType: value['messageType'] as String? ?? 'text',
        createdAt: DateTime.tryParse(value['createdAt'] as String? ?? '') ??
            DateTime.now(),
      );
    }

    final messages = (json['messages'] as List<dynamic>? ?? const [])
        .map((item) => parseMessage(item as Map<String, dynamic>))
        .whereType<ChatMessage>()
        .toList();

    return ChatConversation(
      id: json['conversationId'] as String? ?? json['id'] as String? ?? '',
      memberName: json['memberName'] as String? ?? 'Member',
      phoneNumber: json['phoneNumber'] as String? ?? '',
      status: json['status'] as String? ?? 'waiting',
      loanId: json['loanId'] as String?,
      routingLevel: json['routingLevel'] as String?,
      issueCategory: json['category'] as String? ??
          json['issueCategory'] as String? ??
          'general_help',
      channel: json['channel'] as String? ?? 'mobile',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ??
          DateTime.now(),
      escalationFlag: json['escalationFlag'] as bool? ?? false,
      priority: json['priority'] as String? ?? 'normal',
      branchName: json['branchName'] as String?,
      assignedToStaffName: json['assignedToStaffName'] as String?,
      assignedAgentId: json['assignedAgentId'] as String?,
      responseDueAt: DateTime.tryParse(json['responseDueAt'] as String? ?? ''),
      slaState: json['slaState'] as String?,
      latestMessage:
          parseMessage(json['latestMessage'] as Map<String, dynamic>?),
      messages: messages,
    );
  }

  Map<String, String> _authHeaders() {
    return {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };
  }
}

class HttpAutopayApi implements AutopayApi {
  HttpAutopayApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<AutopayInstruction> createInstruction({
    required String provider,
    required String accountId,
    required String schedule,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/autopay/create'),
      headers: _authHeaders(),
      body: jsonEncode({
        'provider': provider,
        'accountId': accountId,
        'schedule': schedule,
      }),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unable to save auto payment.');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return _toInstruction((data['item'] as Map<String, dynamic>?) ?? data);
  }

  @override
  Future<List<AutopayInstruction>> fetchInstructions() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/autopay/list'),
      headers: _authHeaders(),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unable to load auto payments.');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => _toInstruction(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<AutopayInstruction> updateInstructionStatus({
    String? id,
    String? provider,
    required bool enabled,
  }) async {
    final response = await _client.patch(
      Uri.parse('$baseUrl/autopay/status'),
      headers: _authHeaders(),
      body: jsonEncode({
        if (id != null) 'id': id,
        if (provider != null) 'provider': provider,
        'enabled': enabled,
      }),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unable to update auto payment.');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return _toInstruction((data['item'] as Map<String, dynamic>?) ?? data);
  }

  AutopayInstruction _toInstruction(Map<String, dynamic> item) {
    return AutopayInstruction(
      id: item['id'] as String? ?? '',
      serviceType: item['provider'] as String? ??
          item['serviceType'] as String? ??
          'autopay',
      accountId: item['accountId'] as String? ?? '',
      schedule: item['schedule'] as String? ?? 'monthly',
      enabled: item['enabled'] as bool? ?? false,
    );
  }

  Map<String, String> _authHeaders() {
    return {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };
  }
}

class HttpSecurityApi implements SecurityApi {
  HttpSecurityApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<SecurityOverview> fetchOverview() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/auth/security-overview'),
      headers: _authHeaders(),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unable to load security overview.');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return SecurityOverview(
      accountLockEnabled: data['accountLockEnabled'] as bool? ?? false,
      highRiskActionVerification:
          data['highRiskActionVerification'] as bool? ?? true,
      sessions: ((data['sessions'] as List<dynamic>?) ?? const [])
          .map(
            (item) => _toSession(item as Map<String, dynamic>),
          )
          .toList(),
      devices: ((data['devices'] as List<dynamic>?) ?? const [])
          .map(
            (item) => _toDevice(item as Map<String, dynamic>),
          )
          .toList(),
    );
  }

  @override
  Future<void> revokeSession(String challengeId) async {
    final response = await _client.delete(
      Uri.parse('$baseUrl/auth/sessions/$challengeId'),
      headers: _authHeaders(),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unable to revoke session.');
    }
  }

  @override
  Future<bool> updateAccountLock(bool enabled) async {
    final response = await _client.patch(
      Uri.parse('$baseUrl/security/account-lock'),
      headers: _authHeaders(),
      body: jsonEncode({'enabled': enabled}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unable to update security settings.');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['accountLockEnabled'] as bool? ?? enabled;
  }

  MemberAuthSession _toSession(Map<String, dynamic> item) {
    return MemberAuthSession(
      challengeId: item['challengeId'] as String? ?? '',
      loginIdentifier: item['loginIdentifier'] as String? ?? '',
      status: item['status'] as String? ?? 'pending',
      isCurrent: item['isCurrent'] as bool? ?? false,
      deviceId: item['deviceId'] as String?,
      expiresAt: DateTime.tryParse(item['expiresAt'] as String? ?? ''),
      verifiedAt: DateTime.tryParse(item['verifiedAt'] as String? ?? ''),
      loggedOutAt: DateTime.tryParse(item['loggedOutAt'] as String? ?? ''),
      updatedAt: DateTime.tryParse(item['updatedAt'] as String? ?? ''),
    );
  }

  MemberDevice _toDevice(Map<String, dynamic> item) {
    return MemberDevice(
      deviceId: item['deviceId'] as String? ?? '',
      rememberDevice: item['rememberDevice'] as bool? ?? false,
      biometricEnabled: item['biometricEnabled'] as bool? ?? false,
      isCurrent: item['isCurrent'] as bool? ?? false,
      lastLoginAt: DateTime.tryParse(item['lastLoginAt'] as String? ?? ''),
      updatedAt: DateTime.tryParse(item['updatedAt'] as String? ?? ''),
    );
  }

  Map<String, String> _authHeaders() {
    return {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };
  }
}

class HttpCardApi implements CardApi {
  HttpCardApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<List<CardItem>> fetchMyCards() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/cards/my'),
      headers: _authHeaders(),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Card request failed.');
    }
    final data = jsonDecode(response.body) as List<dynamic>;
    return data.map((item) => _toCard(item as Map<String, dynamic>)).toList();
  }

  @override
  Future<CardRequestResult> createCardRequest({
    String requestType = 'new_issue',
    String? preferredBranch,
    String? reason,
    String? cardType,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/cards/request'),
      headers: _authHeaders(),
      body: jsonEncode({
        'requestType': requestType,
        if (preferredBranch != null) 'preferredBranch': preferredBranch,
        if (reason != null) 'reason': reason,
        if (cardType != null) 'cardType': cardType,
      }),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unable to create card request.');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return _toRequest(data['request'] as Map<String, dynamic>);
  }

  @override
  Future<CardItem> lockCard(String cardId) async {
    final response = await _client.patch(
      Uri.parse('$baseUrl/cards/$cardId/lock'),
      headers: _authHeaders(),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unable to lock card.');
    }
    return _toCard(jsonDecode(response.body) as Map<String, dynamic>);
  }

  @override
  Future<CardRequestResult> requestReplacement(
    String cardId, {
    String? reason,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/cards/$cardId/replacement'),
      headers: _authHeaders(),
      body: jsonEncode({
        if (reason != null) 'reason': reason,
      }),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unable to request replacement.');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return _toRequest(data['request'] as Map<String, dynamic>);
  }

  @override
  Future<CardItem> unlockCard(String cardId) async {
    final response = await _client.patch(
      Uri.parse('$baseUrl/cards/$cardId/unlock'),
      headers: _authHeaders(),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unable to unlock card.');
    }
    return _toCard(jsonDecode(response.body) as Map<String, dynamic>);
  }

  CardItem _toCard(Map<String, dynamic> item) {
    return CardItem(
      id: item['id'] as String,
      cardType: item['cardType'] as String? ?? 'Debit Card',
      last4: item['last4'] as String?,
      status: item['status'] as String? ?? 'pending_issue',
      preferredBranch: item['preferredBranch'] as String?,
      channelControls:
          (item['channelControls'] as Map<String, dynamic>?) ?? const {},
      issuedAt: DateTime.tryParse(item['issuedAt'] as String? ?? ''),
      lockedAt: DateTime.tryParse(item['lockedAt'] as String? ?? ''),
    );
  }

  CardRequestResult _toRequest(Map<String, dynamic> item) {
    return CardRequestResult(
      id: item['id'] as String,
      requestType: item['requestType'] as String? ?? 'new_issue',
      status: item['status'] as String? ?? 'submitted',
      cardId: item['cardId'] as String?,
    );
  }

  Map<String, String> _authHeaders() {
    return {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };
  }
}

class HttpServiceRequestApi implements ServiceRequestApi {
  HttpServiceRequestApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<List<ServiceRequest>> fetchMyRequests() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/service-requests/my'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Service requests request failed.');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => _toServiceRequest(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<ServiceRequest> fetchRequestDetail(String requestId) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/service-requests/$requestId'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Service request detail failed.');
    }

    return _toServiceRequest(jsonDecode(response.body) as Map<String, dynamic>);
  }

  @override
  Future<ServiceRequest> createRequest({
    required String type,
    required String title,
    required String description,
    Map<String, dynamic>? payload,
    List<String>? attachments,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/service-requests'),
      headers: _authHeaders(),
      body: jsonEncode({
        'type': type,
        'title': title,
        'description': description,
        if (payload != null) 'payload': payload,
        if (attachments != null) 'attachments': attachments,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Create service request failed.');
    }

    return _toServiceRequest(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Map<String, String> _authHeaders() => {
        'Content-Type': 'application/json',
        if (sessionStore.accessToken != null)
          'Authorization': 'Bearer ${sessionStore.accessToken}',
      };
}

ServiceRequest _toServiceRequest(Map<String, dynamic> data) {
  final timeline = data['timeline'] as List<dynamic>? ?? const [];
  return ServiceRequest(
    id: data['id'] as String? ?? '',
    type: data['type'] as String? ?? 'failed_transfer',
    title: data['title'] as String? ?? '',
    description: data['description'] as String? ?? '',
    status: data['status'] as String? ?? 'submitted',
    latestNote: data['latestNote'] as String?,
    createdAt:
        DateTime.tryParse(data['createdAt'] as String? ?? '') ?? DateTime.now(),
    payload: Map<String, dynamic>.from(
      data['payload'] as Map<String, dynamic>? ?? const <String, dynamic>{},
    ),
    attachments: (data['attachments'] as List<dynamic>? ?? const [])
        .map((item) => item.toString())
        .toList(),
    timeline: timeline
        .map(
          (item) => ServiceRequestEvent(
            id: (item as Map<String, dynamic>)['id'] as String? ?? '',
            eventType: item['eventType'] as String? ?? '',
            actorType: item['actorType'] as String? ?? '',
            actorName: item['actorName'] as String?,
            note: item['note'] as String?,
            toStatus: item['toStatus'] as String?,
            createdAt: DateTime.tryParse(item['createdAt'] as String? ?? ''),
          ),
        )
        .toList(),
  );
}

class HttpVotingApi implements VotingApi {
  HttpVotingApi({
    required this.baseUrl,
    required this.sessionStore,
    http.Client? client,
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final SessionStore sessionStore;
  final http.Client _client;

  @override
  Future<List<VoteSummary>> fetchActiveVotes() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/votes/active'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Active votes request failed.');
    }

    final data = jsonDecode(response.body) as List<dynamic>;

    return data
        .map((item) => item as Map<String, dynamic>)
        .map(
          (item) => VoteSummary(
            voteId: item['id'] as String,
            title: item['title'] as String? ?? 'Vote',
            description: item['description'] as String? ?? '',
            status: item['status'] as String? ?? 'open',
            startDate: DateTime.tryParse(item['startDate'] as String? ?? '') ??
                DateTime(2026, 1, 1),
            endDate: DateTime.tryParse(item['endDate'] as String? ?? '') ??
                DateTime(2026, 1, 1),
          ),
        )
        .toList();
  }

  @override
  Future<VoteDetail> fetchVoteDetail(String voteId) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/votes/$voteId'),
      headers: _authHeaders(),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Vote detail request failed.');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final options = (data['options'] as List<dynamic>? ?? const [])
        .map((item) => item as Map<String, dynamic>)
        .map(
          (item) => VoteOption(
            optionId: item['id'] as String? ?? '',
            voteId: item['voteId'] as String? ?? voteId,
            name: item['name'] as String? ?? 'Option',
            description: item['description'] as String?,
            displayOrder: item['displayOrder'] as int? ?? 0,
          ),
        )
        .toList()
      ..sort((left, right) => left.displayOrder.compareTo(right.displayOrder));

    return VoteDetail(
      voteId: data['id'] as String? ?? voteId,
      title: data['title'] as String? ?? 'Vote',
      description: data['description'] as String? ?? '',
      status: data['status'] as String? ?? 'open',
      startDate: DateTime.tryParse(data['startDate'] as String? ?? '') ??
          DateTime(2026, 1, 1),
      endDate: DateTime.tryParse(data['endDate'] as String? ?? '') ??
          DateTime(2026, 1, 1),
      options: options,
    );
  }

  @override
  Future<Map<String, dynamic>> submitVote(
    String voteId, {
    required String optionId,
    required String encryptedBallot,
    required String otpCode,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/votes/$voteId/respond'),
      headers: _authHeaders(),
      body: jsonEncode({
        'optionId': optionId,
        'encryptedBallot': encryptedBallot,
        'otpCode': otpCode,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Vote submission failed.');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Map<String, String> _authHeaders() {
    return {
      'Content-Type': 'application/json',
      if (sessionStore.accessToken != null)
        'Authorization': 'Bearer ${sessionStore.accessToken}',
    };
  }
}

String buildBranchLabel(String? branchId) {
  if (branchId == null || branchId.isEmpty) {
    return 'Unknown Branch';
  }

  return 'Branch $branchId';
}

String formatScopeLabel(String input) {
  return input
      .replaceAll('.', ' ')
      .replaceAll('_', ' ')
      .split(' ')
      .where((part) => part.trim().isNotEmpty)
      .map(
        (part) => '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}',
      )
      .join(' ');
}
