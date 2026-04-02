import '../models/index.dart';
import 'api_contracts.dart';
import 'api_config.dart';
import 'demo_bank_api.dart';
import 'http_bank_api.dart';
import 'session_store.dart';

class AppServices {
  const AppServices({
    required this.authApi,
    required this.locationApi,
    required this.memberApi,
    required this.identityVerificationApi,
    required this.savingsApi,
    required this.schoolPaymentApi,
    required this.loanApi,
    required this.notificationApi,
    required this.chatApi,
    required this.votingApi,
    required this.sessionStore,
  });

  final AuthApi authApi;
  final LocationApi locationApi;
  final MemberApi memberApi;
  final IdentityVerificationApi identityVerificationApi;
  final SavingsApi savingsApi;
  final SchoolPaymentApi schoolPaymentApi;
  final LoanApi loanApi;
  final NotificationApi notificationApi;
  final ChatApi chatApi;
  final VotingApi votingApi;
  final SessionStore sessionStore;

  factory AppServices.demo() {
    return AppServices(
      authApi: DemoAuthApi(),
      locationApi: DemoLocationApi(),
      memberApi: DemoMemberApi(),
      identityVerificationApi: DemoIdentityVerificationApi(),
      savingsApi: DemoSavingsApi(),
      schoolPaymentApi: DemoSchoolPaymentApi(),
      loanApi: DemoLoanApi(),
      notificationApi: DemoNotificationApi(),
      chatApi: DemoChatApi(),
      votingApi: DemoVotingApi(),
      sessionStore: SessionStore(),
    );
  }

  factory AppServices.create() {
    if (!ApiConfig.hasBaseUrl) {
      if (!ApiConfig.demoModeEnabled) {
        throw StateError(
          'API_BASE_URL must be provided when APP_DEMO_MODE is disabled.',
        );
      }

      return AppServices.demo();
    }

    final sessionStore = SessionStore();
    final demo = AppServices.demo();
    const demoFallbackEnabled = ApiConfig.demoModeEnabled;

    return AppServices(
      authApi: HttpAuthApi(
        baseUrl: ApiConfig.baseUrl,
        sessionStore: sessionStore,
      ),
      locationApi: demoFallbackEnabled
          ? FallbackLocationApi(
              primary: HttpLocationApi(
                baseUrl: ApiConfig.baseUrl,
                sessionStore: sessionStore,
              ),
              fallback: demo.locationApi,
            )
          : HttpLocationApi(
              baseUrl: ApiConfig.baseUrl,
              sessionStore: sessionStore,
            ),
      memberApi: demoFallbackEnabled
          ? FallbackMemberApi(
              primary: HttpMemberApi(
                baseUrl: ApiConfig.baseUrl,
                sessionStore: sessionStore,
              ),
              fallback: demo.memberApi,
            )
          : HttpMemberApi(
              baseUrl: ApiConfig.baseUrl,
              sessionStore: sessionStore,
            ),
      identityVerificationApi: demoFallbackEnabled
          ? FallbackIdentityVerificationApi(
              primary: HttpIdentityVerificationApi(
                baseUrl: ApiConfig.baseUrl,
                sessionStore: sessionStore,
              ),
              fallback: demo.identityVerificationApi,
            )
          : HttpIdentityVerificationApi(
              baseUrl: ApiConfig.baseUrl,
              sessionStore: sessionStore,
            ),
      savingsApi: demoFallbackEnabled
          ? FallbackSavingsApi(
              primary: HttpSavingsApi(
                baseUrl: ApiConfig.baseUrl,
                sessionStore: sessionStore,
              ),
              fallback: demo.savingsApi,
            )
          : HttpSavingsApi(
              baseUrl: ApiConfig.baseUrl,
              sessionStore: sessionStore,
            ),
      schoolPaymentApi: demoFallbackEnabled
          ? FallbackSchoolPaymentApi(
              primary: HttpSchoolPaymentApi(
                baseUrl: ApiConfig.baseUrl,
                sessionStore: sessionStore,
              ),
              fallback: demo.schoolPaymentApi,
            )
          : HttpSchoolPaymentApi(
              baseUrl: ApiConfig.baseUrl,
              sessionStore: sessionStore,
            ),
      loanApi: demoFallbackEnabled
          ? FallbackLoanApi(
              primary: HttpLoanApi(
                baseUrl: ApiConfig.baseUrl,
                sessionStore: sessionStore,
              ),
              fallback: demo.loanApi,
            )
          : HttpLoanApi(
              baseUrl: ApiConfig.baseUrl,
              sessionStore: sessionStore,
            ),
      notificationApi: demoFallbackEnabled
          ? FallbackNotificationApi(
              primary: HttpNotificationApi(
                baseUrl: ApiConfig.baseUrl,
                sessionStore: sessionStore,
              ),
              fallback: demo.notificationApi,
            )
          : HttpNotificationApi(
              baseUrl: ApiConfig.baseUrl,
              sessionStore: sessionStore,
            ),
      chatApi: HttpChatApi(
        baseUrl: ApiConfig.baseUrl,
        sessionStore: sessionStore,
      ),
      votingApi: demoFallbackEnabled
          ? FallbackVotingApi(
              primary: HttpVotingApi(
                baseUrl: ApiConfig.baseUrl,
                sessionStore: sessionStore,
              ),
              fallback: demo.votingApi,
            )
          : HttpVotingApi(
              baseUrl: ApiConfig.baseUrl,
              sessionStore: sessionStore,
            ),
      sessionStore: sessionStore,
    );
  }

  void clearSession() {
    sessionStore.clear();
  }
}

class FallbackAuthApi implements AuthApi {
  FallbackAuthApi({
    required this.primary,
    required this.fallback,
  });

  final AuthApi primary;
  final AuthApi fallback;

  @override
  Future<LoginChallenge> startLogin({
    required String identifier,
    String? deviceId,
  }) async {
    try {
      return await primary.startLogin(
          identifier: identifier, deviceId: deviceId);
    } catch (_) {
      return fallback.startLogin(identifier: identifier, deviceId: deviceId);
    }
  }

  @override
  Future<MemberSession> verifyPin({
    required String challengeId,
    required String pin,
    bool rememberDevice = false,
    bool biometricEnabled = false,
    String? deviceId,
  }) async {
    try {
      return await primary.verifyPin(
        challengeId: challengeId,
        pin: pin,
        rememberDevice: rememberDevice,
        biometricEnabled: biometricEnabled,
        deviceId: deviceId,
      );
    } catch (_) {
      return fallback.verifyPin(
        challengeId: challengeId,
        pin: pin,
        rememberDevice: rememberDevice,
        biometricEnabled: biometricEnabled,
        deviceId: deviceId,
      );
    }
  }

  @override
  Future<AccountCheckResult> checkExistingAccount({
    required String phoneNumber,
    String? faydaFin,
    String? email,
  }) async {
    try {
      return await primary.checkExistingAccount(
        phoneNumber: phoneNumber,
        faydaFin: faydaFin,
        email: email,
      );
    } catch (_) {
      return fallback.checkExistingAccount(
        phoneNumber: phoneNumber,
        faydaFin: faydaFin,
        email: email,
      );
    }
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
    try {
      return await primary.register(
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        email: email,
        dateOfBirth: dateOfBirth,
        region: region,
        city: city,
        preferredBranchId: preferredBranchId,
        preferredBranchName: preferredBranchName,
        password: password,
        confirmPassword: confirmPassword,
        faydaFin: faydaFin,
        faydaAlias: faydaAlias,
        faydaQrData: faydaQrData,
        faydaFrontImage: faydaFrontImage,
        faydaBackImage: faydaBackImage,
        consentAccepted: consentAccepted,
      );
    } catch (_) {
      return fallback.register(
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        email: email,
        dateOfBirth: dateOfBirth,
        region: region,
        city: city,
        preferredBranchId: preferredBranchId,
        preferredBranchName: preferredBranchName,
        password: password,
        confirmPassword: confirmPassword,
        faydaFin: faydaFin,
        faydaAlias: faydaAlias,
        faydaQrData: faydaQrData,
        faydaFrontImage: faydaFrontImage,
        faydaBackImage: faydaBackImage,
        consentAccepted: consentAccepted,
      );
    }
  }

  @override
  Future<MemberSession> login({
    required String customerId,
    required String password,
  }) async {
    try {
      return await primary.login(customerId: customerId, password: password);
    } catch (_) {
      return fallback.login(customerId: customerId, password: password);
    }
  }

  @override
  Future<void> logout() async {
    try {
      await primary.logout();
    } catch (_) {
      await fallback.logout();
    }
  }

  @override
  Future<Map<String, dynamic>> requestOtp(String phoneNumber) async {
    try {
      return await primary.requestOtp(phoneNumber);
    } catch (_) {
      return fallback.requestOtp(phoneNumber);
    }
  }

  @override
  Future<Map<String, dynamic>> verifyOtp({
    required String phoneNumber,
    required String otpCode,
  }) async {
    try {
      return await primary.verifyOtp(
        phoneNumber: phoneNumber,
        otpCode: otpCode,
      );
    } catch (_) {
      return fallback.verifyOtp(phoneNumber: phoneNumber, otpCode: otpCode);
    }
  }
}

class FallbackLocationApi implements LocationApi {
  FallbackLocationApi({
    required this.primary,
    required this.fallback,
  });

  final LocationApi primary;
  final LocationApi fallback;

  @override
  Future<List<String>> fetchRegions() async {
    try {
      return await primary.fetchRegions();
    } catch (_) {
      return fallback.fetchRegions();
    }
  }

  @override
  Future<List<String>> fetchCities(String region) async {
    try {
      return await primary.fetchCities(region);
    } catch (_) {
      return fallback.fetchCities(region);
    }
  }

  @override
  Future<List<LocationBranchOption>> fetchBranches({
    required String region,
    required String city,
  }) async {
    try {
      return await primary.fetchBranches(region: region, city: city);
    } catch (_) {
      return fallback.fetchBranches(region: region, city: city);
    }
  }
}

class FallbackIdentityVerificationApi implements IdentityVerificationApi {
  FallbackIdentityVerificationApi({
    required this.primary,
    required this.fallback,
  });

  final IdentityVerificationApi primary;
  final IdentityVerificationApi fallback;

  @override
  Future<IdentityVerificationResult> getStatus() async {
    try {
      return await primary.getStatus();
    } catch (_) {
      return fallback.getStatus();
    }
  }

  @override
  Future<IdentityVerificationResult> submitFin({
    required String faydaFin,
    String? faydaAlias,
  }) async {
    try {
      return await primary.submitFin(
          faydaFin: faydaFin, faydaAlias: faydaAlias);
    } catch (_) {
      return fallback.submitFin(faydaFin: faydaFin, faydaAlias: faydaAlias);
    }
  }

  @override
  Future<IdentityVerificationResult> uploadQr({
    String? qrDataRaw,
    String? faydaAlias,
  }) async {
    try {
      return await primary.uploadQr(
          qrDataRaw: qrDataRaw, faydaAlias: faydaAlias);
    } catch (_) {
      return fallback.uploadQr(qrDataRaw: qrDataRaw, faydaAlias: faydaAlias);
    }
  }

  @override
  Future<IdentityVerificationResult> verify() async {
    try {
      return await primary.verify();
    } catch (_) {
      return fallback.verify();
    }
  }
}

class FallbackMemberApi implements MemberApi {
  FallbackMemberApi({
    required this.primary,
    required this.fallback,
  });

  final MemberApi primary;
  final MemberApi fallback;

  @override
  Future<MemberProfile> fetchMyProfile(String memberId) async {
    try {
      return await primary.fetchMyProfile(memberId);
    } catch (_) {
      return fallback.fetchMyProfile(memberId);
    }
  }
}

class FallbackSavingsApi implements SavingsApi {
  FallbackSavingsApi({
    required this.primary,
    required this.fallback,
  });

  final SavingsApi primary;
  final SavingsApi fallback;

  @override
  Future<List<SavingsAccount>> fetchMyAccounts(String memberId) async {
    try {
      return await primary.fetchMyAccounts(memberId);
    } catch (_) {
      return fallback.fetchMyAccounts(memberId);
    }
  }

  @override
  Future<List<AccountTransaction>> fetchAccountTransactions(
    String accountId,
  ) async {
    try {
      return await primary.fetchAccountTransactions(accountId);
    } catch (_) {
      return fallback.fetchAccountTransactions(accountId);
    }
  }
}

class FallbackSchoolPaymentApi implements SchoolPaymentApi {
  FallbackSchoolPaymentApi({
    required this.primary,
    required this.fallback,
  });

  final SchoolPaymentApi primary;
  final SchoolPaymentApi fallback;

  @override
  Future<SchoolPaymentResult> createSchoolPayment({
    required String accountId,
    required String studentId,
    required String schoolName,
    required double amount,
    required String channel,
    String? narration,
  }) async {
    try {
      return await primary.createSchoolPayment(
        accountId: accountId,
        studentId: studentId,
        schoolName: schoolName,
        amount: amount,
        channel: channel,
        narration: narration,
      );
    } catch (_) {
      return fallback.createSchoolPayment(
        accountId: accountId,
        studentId: studentId,
        schoolName: schoolName,
        amount: amount,
        channel: channel,
        narration: narration,
      );
    }
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMySchoolPayments() async {
    try {
      return await primary.fetchMySchoolPayments();
    } catch (_) {
      return fallback.fetchMySchoolPayments();
    }
  }
}

class FallbackLoanApi implements LoanApi {
  FallbackLoanApi({
    required this.primary,
    required this.fallback,
  });

  final LoanApi primary;
  final LoanApi fallback;

  @override
  Future<List<LoanSummary>> fetchMyLoans() async {
    try {
      return await primary.fetchMyLoans();
    } catch (_) {
      return fallback.fetchMyLoans();
    }
  }

  @override
  Future<LoanSummary> fetchLoanDetail(String loanId) async {
    try {
      return await primary.fetchLoanDetail(loanId);
    } catch (_) {
      return fallback.fetchLoanDetail(loanId);
    }
  }

  @override
  Future<LoanSummary> submitLoanApplication({
    required String loanType,
    required double amount,
    required double interestRate,
    required int termMonths,
    required String purpose,
  }) async {
    try {
      return await primary.submitLoanApplication(
        loanType: loanType,
        amount: amount,
        interestRate: interestRate,
        termMonths: termMonths,
        purpose: purpose,
      );
    } catch (_) {
      return fallback.submitLoanApplication(
        loanType: loanType,
        amount: amount,
        interestRate: interestRate,
        termMonths: termMonths,
        purpose: purpose,
      );
    }
  }
}

class FallbackNotificationApi implements NotificationApi {
  FallbackNotificationApi({
    required this.primary,
    required this.fallback,
  });

  final NotificationApi primary;
  final NotificationApi fallback;

  @override
  Future<List<AppNotification>> fetchMyNotifications() async {
    try {
      return await primary.fetchMyNotifications();
    } catch (_) {
      return fallback.fetchMyNotifications();
    }
  }

  @override
  Future<AppNotification> markAsRead(String notificationId) async {
    try {
      return await primary.markAsRead(notificationId);
    } catch (_) {
      return fallback.markAsRead(notificationId);
    }
  }
}

class FallbackVotingApi implements VotingApi {
  FallbackVotingApi({
    required this.primary,
    required this.fallback,
  });

  final VotingApi primary;
  final VotingApi fallback;

  @override
  Future<List<VoteSummary>> fetchActiveVotes() async {
    try {
      return await primary.fetchActiveVotes();
    } catch (_) {
      return fallback.fetchActiveVotes();
    }
  }

  @override
  Future<Map<String, dynamic>> submitVote(
    String voteId, {
    required String optionId,
    required String encryptedBallot,
    required String otpCode,
  }) async {
    try {
      return await primary.submitVote(
        voteId,
        optionId: optionId,
        encryptedBallot: encryptedBallot,
        otpCode: otpCode,
      );
    } catch (_) {
      return fallback.submitVote(
        voteId,
        optionId: optionId,
        encryptedBallot: encryptedBallot,
        otpCode: otpCode,
      );
    }
  }
}
