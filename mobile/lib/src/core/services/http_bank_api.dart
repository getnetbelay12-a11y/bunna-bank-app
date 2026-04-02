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
      throw Exception('PIN verification failed.');
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
      throw Exception('Member login failed.');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return _toSession(data);
  }

  @override
  Future<Map<String, dynamic>> requestOtp(String phoneNumber) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/request-otp'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'phoneNumber': phoneNumber}),
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
  Future<void> logout() async {
    await _client.post(
      Uri.parse('$baseUrl/auth/logout'),
      headers: _authHeaders(),
    );
    sessionStore.clear();
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
    sessionStore.accessToken = data['accessToken'] as String?;
    sessionStore.refreshToken = data['refreshToken'] as String?;

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
      status: item['status'] as String? ?? 'submitted',
      currentLevel: item['currentLevel'] as String? ?? 'branch',
      purpose: item['purpose'] as String?,
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
      status: item['status'] as String? ?? 'sent',
      title: item['title'] as String? ?? 'Notification',
      message: item['message'] as String? ?? '',
      createdAt: DateTime.tryParse(item['createdAt'] as String? ?? '') ??
          DateTime(2026, 1, 1),
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
    String? initialMessage,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/support/chats'),
      headers: _authHeaders(),
      body: jsonEncode({
        'issueCategory': issueCategory,
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
      issueCategory: json['category'] as String? ??
          json['issueCategory'] as String? ??
          'general_help',
      channel: json['channel'] as String? ?? 'mobile',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ??
          DateTime.now(),
      escalationFlag: json['escalationFlag'] as bool? ?? false,
      branchName: json['branchName'] as String?,
      assignedToStaffName: json['assignedToStaffName'] as String?,
      assignedAgentId: json['assignedAgentId'] as String?,
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
