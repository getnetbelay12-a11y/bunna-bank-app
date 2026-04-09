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
    required this.shareholderApi,
    required this.recommendationApi,
    required this.insightApi,
    required this.identityVerificationApi,
    required this.savingsApi,
    required this.schoolPaymentApi,
    required this.loanApi,
    required this.notificationApi,
    required this.documentUploadApi,
    required this.chatApi,
    required this.autopayApi,
    required this.securityApi,
    required this.cardApi,
    required this.serviceRequestApi,
    required this.votingApi,
    required this.sessionStore,
  });

  final AuthApi authApi;
  final LocationApi locationApi;
  final MemberApi memberApi;
  final ShareholderApi shareholderApi;
  final RecommendationApi recommendationApi;
  final InsightApi insightApi;
  final IdentityVerificationApi identityVerificationApi;
  final SavingsApi savingsApi;
  final SchoolPaymentApi schoolPaymentApi;
  final LoanApi loanApi;
  final NotificationApi notificationApi;
  final DocumentUploadApi documentUploadApi;
  final ChatApi chatApi;
  final AutopayApi autopayApi;
  final SecurityApi securityApi;
  final CardApi cardApi;
  final ServiceRequestApi serviceRequestApi;
  final VotingApi votingApi;
  final SessionStore sessionStore;

  factory AppServices.demo() {
    return AppServices(
      authApi: DemoAuthApi(),
      locationApi: DemoLocationApi(),
      memberApi: DemoMemberApi(),
      shareholderApi: DemoShareholderApi(),
      recommendationApi: DemoRecommendationApi(),
      insightApi: DemoInsightApi(),
      identityVerificationApi: DemoIdentityVerificationApi(),
      savingsApi: DemoSavingsApi(),
      schoolPaymentApi: DemoSchoolPaymentApi(),
      loanApi: DemoLoanApi(),
      notificationApi: DemoNotificationApi(),
      documentUploadApi: DemoDocumentUploadApi(),
      chatApi: DemoChatApi(),
      autopayApi: DemoAutopayApi(),
      securityApi: DemoSecurityApi(),
      cardApi: DemoCardApi(),
      serviceRequestApi: DemoServiceRequestApi(),
      votingApi: DemoVotingApi(),
      sessionStore: SessionStore(),
    );
  }

  factory AppServices.create() {
    if (!ApiConfig.hasBaseUrl) {
      return AppServices.demo();
    }

    final sessionStore = SessionStore();
    final demo = AppServices.demo();

    return AppServices(
      authApi: FallbackAuthApi(
        primary: HttpAuthApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.authApi,
      ),
      locationApi: FallbackLocationApi(
        primary: HttpLocationApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.locationApi,
      ),
      memberApi: FallbackMemberApi(
        primary: HttpMemberApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.memberApi,
      ),
      shareholderApi: FallbackShareholderApi(
        primary: HttpShareholderApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.shareholderApi,
      ),
      recommendationApi: FallbackRecommendationApi(
        primary: HttpRecommendationApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.recommendationApi,
      ),
      insightApi: FallbackInsightApi(
        primary: HttpInsightApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.insightApi,
      ),
      identityVerificationApi: FallbackIdentityVerificationApi(
        primary: HttpIdentityVerificationApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.identityVerificationApi,
      ),
      savingsApi: FallbackSavingsApi(
        primary: HttpSavingsApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.savingsApi,
      ),
      schoolPaymentApi: FallbackSchoolPaymentApi(
        primary: HttpSchoolPaymentApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.schoolPaymentApi,
      ),
      loanApi: FallbackLoanApi(
        primary: HttpLoanApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.loanApi,
      ),
      notificationApi: FallbackNotificationApi(
        primary: HttpNotificationApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.notificationApi,
      ),
      documentUploadApi: FallbackDocumentUploadApi(
        primary: HttpDocumentUploadApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.documentUploadApi,
      ),
      chatApi: HttpChatApi(
        baseUrl: ApiConfig.baseUrl,
        sessionStore: sessionStore,
      ),
      autopayApi: FallbackAutopayApi(
        primary: HttpAutopayApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.autopayApi,
      ),
      securityApi: FallbackSecurityApi(
        primary: HttpSecurityApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.securityApi,
      ),
      cardApi: FallbackCardApi(
        primary: HttpCardApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.cardApi,
      ),
      serviceRequestApi: FallbackServiceRequestApi(
        primary: HttpServiceRequestApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.serviceRequestApi,
      ),
      votingApi: FallbackVotingApi(
        primary: HttpVotingApi(
          baseUrl: ApiConfig.baseUrl,
          sessionStore: sessionStore,
        ),
        fallback: demo.votingApi,
      ),
      sessionStore: sessionStore,
    );
  }

  void clearSession() {
    sessionStore.clear();
  }
}

class FallbackDocumentUploadApi implements DocumentUploadApi {
  FallbackDocumentUploadApi({
    required this.primary,
    required this.fallback,
  });

  final DocumentUploadApi primary;
  final DocumentUploadApi fallback;

  @override
  Future<UploadedDocument> uploadDocument({
    required String filePath,
    required String originalFileName,
    required String domain,
    String? entityId,
    String? documentType,
  }) async {
    try {
      return await primary.uploadDocument(
        filePath: filePath,
        originalFileName: originalFileName,
        domain: domain,
        entityId: entityId,
        documentType: documentType,
      );
    } catch (_) {
      return fallback.uploadDocument(
        filePath: filePath,
        originalFileName: originalFileName,
        domain: domain,
        entityId: entityId,
        documentType: documentType,
      );
    }
  }
}

class FallbackInsightApi implements InsightApi {
  FallbackInsightApi({
    required this.primary,
    required this.fallback,
  });

  final InsightApi primary;
  final InsightApi fallback;

  @override
  Future<SmartInsightFeed> fetchMyInsights() async {
    try {
      return await primary.fetchMyInsights();
    } catch (_) {
      return fallback.fetchMyInsights();
    }
  }

  @override
  Future<SmartInsightFeed> fetchMyHomeInsights() async {
    try {
      return await primary.fetchMyHomeInsights();
    } catch (_) {
      return fallback.fetchMyHomeInsights();
    }
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
  Future<MemberSession?> restoreSession() async {
    try {
      return await primary.restoreSession();
    } catch (_) {
      return fallback.restoreSession();
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
  Future<Map<String, dynamic>> requestOtp({
    required String phoneNumber,
    String? email,
    String preferredChannel = 'sms',
    String? purpose,
  }) async {
    try {
      return await primary.requestOtp(
        phoneNumber: phoneNumber,
        email: email,
        preferredChannel: preferredChannel,
        purpose: purpose,
      );
    } catch (_) {
      return fallback.requestOtp(
        phoneNumber: phoneNumber,
        email: email,
        preferredChannel: preferredChannel,
        purpose: purpose,
      );
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

  @override
  Future<OnboardingStatus> getOnboardingStatus({
    required String customerId,
    required String phoneNumber,
  }) async {
    try {
      return await primary.getOnboardingStatus(
        customerId: customerId,
        phoneNumber: phoneNumber,
      );
    } catch (_) {
      return fallback.getOnboardingStatus(
        customerId: customerId,
        phoneNumber: phoneNumber,
      );
    }
  }

  @override
  Future<Map<String, dynamic>> resetPin({
    required String phoneNumber,
    String? email,
    required String newPin,
    required String confirmPin,
  }) async {
    try {
      return await primary.resetPin(
        phoneNumber: phoneNumber,
        email: email,
        newPin: newPin,
        confirmPin: confirmPin,
      );
    } catch (_) {
      return fallback.resetPin(
        phoneNumber: phoneNumber,
        email: email,
        newPin: newPin,
        confirmPin: confirmPin,
      );
    }
  }

  @override
  Future<PinRecoveryOptions> getPinRecoveryOptions({
    required String identifier,
  }) async {
    try {
      return await primary.getPinRecoveryOptions(identifier: identifier);
    } catch (_) {
      return fallback.getPinRecoveryOptions(identifier: identifier);
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

class FallbackShareholderApi implements ShareholderApi {
  FallbackShareholderApi({
    required this.primary,
    required this.fallback,
  });

  final ShareholderApi primary;
  final ShareholderApi fallback;

  @override
  Future<ShareholderProfile> fetchMyShareholderProfile() async {
    try {
      return await primary.fetchMyShareholderProfile();
    } catch (_) {
      return fallback.fetchMyShareholderProfile();
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

class FallbackRecommendationApi implements RecommendationApi {
  FallbackRecommendationApi({
    required this.primary,
    required this.fallback,
  });

  final RecommendationApi primary;
  final RecommendationApi fallback;

  @override
  Future<List<SmartRecommendation>> fetchMyRecommendations() async {
    try {
      return await primary.fetchMyRecommendations();
    } catch (_) {
      return fallback.fetchMyRecommendations();
    }
  }

  @override
  Future<void> markViewed(String recommendationId) async {
    try {
      await primary.markViewed(recommendationId);
    } catch (_) {
      await fallback.markViewed(recommendationId);
    }
  }

  @override
  Future<void> dismiss(String recommendationId) async {
    try {
      await primary.dismiss(recommendationId);
    } catch (_) {
      await fallback.dismiss(recommendationId);
    }
  }

  @override
  Future<void> act(String recommendationId, {bool completed = false}) async {
    try {
      await primary.act(recommendationId, completed: completed);
    } catch (_) {
      await fallback.act(recommendationId, completed: completed);
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
  Future<List<Map<String, dynamic>>> fetchMyLinkedStudents() async {
    try {
      return await primary.fetchMyLinkedStudents();
    } catch (_) {
      return fallback.fetchMyLinkedStudents();
    }
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
  Future<QrPaymentResult> createQrPayment({
    required String accountId,
    required String qrPayload,
    required String merchantName,
    required double amount,
    String? narration,
  }) async {
    try {
      return await primary.createQrPayment(
        accountId: accountId,
        qrPayload: qrPayload,
        merchantName: merchantName,
        amount: amount,
        narration: narration,
      );
    } catch (_) {
      return fallback.createQrPayment(
        accountId: accountId,
        qrPayload: qrPayload,
        merchantName: merchantName,
        amount: amount,
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

  @override
  Future<PaymentActivitySummary?> fetchMyPaymentActivity() async {
    try {
      return await primary.fetchMyPaymentActivity();
    } catch (_) {
      return fallback.fetchMyPaymentActivity();
    }
  }

  @override
  Future<List<PaymentReceiptItem>> fetchMyPaymentReceipts() async {
    try {
      return await primary.fetchMyPaymentReceipts();
    } catch (_) {
      return fallback.fetchMyPaymentReceipts();
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

  @override
  Future<List<LoanTimelineItem>> fetchLoanTimeline(String loanId) async {
    try {
      return await primary.fetchLoanTimeline(loanId);
    } catch (_) {
      return fallback.fetchLoanTimeline(loanId);
    }
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
    try {
      return await primary.uploadLoanDocument(
        loanId,
        documentType: documentType,
        originalFileName: originalFileName,
        storageKey: storageKey,
        mimeType: mimeType,
        sizeBytes: sizeBytes,
      );
    } catch (_) {
      return fallback.uploadLoanDocument(
        loanId,
        documentType: documentType,
        originalFileName: originalFileName,
        storageKey: storageKey,
        mimeType: mimeType,
        sizeBytes: sizeBytes,
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

  @override
  Future<void> registerDeviceToken({
    required String deviceId,
    required String platform,
    required String token,
    required String appVersion,
  }) async {
    try {
      await primary.registerDeviceToken(
        deviceId: deviceId,
        platform: platform,
        token: token,
        appVersion: appVersion,
      );
    } catch (_) {
      await fallback.registerDeviceToken(
        deviceId: deviceId,
        platform: platform,
        token: token,
        appVersion: appVersion,
      );
    }
  }
}

class FallbackAutopayApi implements AutopayApi {
  FallbackAutopayApi({
    required this.primary,
    required this.fallback,
  });

  final AutopayApi primary;
  final AutopayApi fallback;

  @override
  Future<List<AutopayInstruction>> fetchInstructions() async {
    try {
      return await primary.fetchInstructions();
    } catch (_) {
      return fallback.fetchInstructions();
    }
  }

  @override
  Future<AutopayInstruction> createInstruction({
    required String provider,
    required String accountId,
    required String schedule,
  }) async {
    try {
      return await primary.createInstruction(
        provider: provider,
        accountId: accountId,
        schedule: schedule,
      );
    } catch (_) {
      return fallback.createInstruction(
        provider: provider,
        accountId: accountId,
        schedule: schedule,
      );
    }
  }

  @override
  Future<AutopayInstruction> updateInstructionStatus({
    String? id,
    String? provider,
    required bool enabled,
  }) async {
    try {
      return await primary.updateInstructionStatus(
        id: id,
        provider: provider,
        enabled: enabled,
      );
    } catch (_) {
      return fallback.updateInstructionStatus(
        id: id,
        provider: provider,
        enabled: enabled,
      );
    }
  }
}

class FallbackSecurityApi implements SecurityApi {
  FallbackSecurityApi({
    required this.primary,
    required this.fallback,
  });

  final SecurityApi primary;
  final SecurityApi fallback;

  @override
  Future<SecurityOverview> fetchOverview() async {
    try {
      return await primary.fetchOverview();
    } catch (_) {
      return fallback.fetchOverview();
    }
  }

  @override
  Future<bool> updateAccountLock(bool enabled) async {
    try {
      return await primary.updateAccountLock(enabled);
    } catch (_) {
      return fallback.updateAccountLock(enabled);
    }
  }

  @override
  Future<void> revokeSession(String challengeId) async {
    try {
      await primary.revokeSession(challengeId);
    } catch (_) {
      await fallback.revokeSession(challengeId);
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
  Future<VoteDetail> fetchVoteDetail(String voteId) async {
    try {
      return await primary.fetchVoteDetail(voteId);
    } catch (_) {
      return fallback.fetchVoteDetail(voteId);
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

class FallbackServiceRequestApi implements ServiceRequestApi {
  FallbackServiceRequestApi({
    required this.primary,
    required this.fallback,
  });

  final ServiceRequestApi primary;
  final ServiceRequestApi fallback;

  @override
  Future<List<ServiceRequest>> fetchMyRequests() async {
    try {
      return await primary.fetchMyRequests();
    } catch (_) {
      return fallback.fetchMyRequests();
    }
  }

  @override
  Future<ServiceRequest> fetchRequestDetail(String requestId) async {
    try {
      return await primary.fetchRequestDetail(requestId);
    } catch (_) {
      return fallback.fetchRequestDetail(requestId);
    }
  }

  @override
  Future<ServiceRequest> createRequest({
    required String type,
    required String title,
    required String description,
    Map<String, dynamic>? payload,
    List<String>? attachments,
  }) async {
    try {
      return await primary.createRequest(
        type: type,
        title: title,
        description: description,
        payload: payload,
        attachments: attachments,
      );
    } catch (_) {
      return fallback.createRequest(
        type: type,
        title: title,
        description: description,
        payload: payload,
        attachments: attachments,
      );
    }
  }
}

class FallbackCardApi implements CardApi {
  FallbackCardApi({
    required this.primary,
    required this.fallback,
  });

  final CardApi primary;
  final CardApi fallback;

  @override
  Future<List<CardItem>> fetchMyCards() async {
    try {
      return await primary.fetchMyCards();
    } catch (_) {
      return fallback.fetchMyCards();
    }
  }

  @override
  Future<CardItem> lockCard(String cardId) async {
    try {
      return await primary.lockCard(cardId);
    } catch (_) {
      return fallback.lockCard(cardId);
    }
  }

  @override
  Future<CardItem> unlockCard(String cardId) async {
    try {
      return await primary.unlockCard(cardId);
    } catch (_) {
      return fallback.unlockCard(cardId);
    }
  }

  @override
  Future<CardRequestResult> createCardRequest({
    String requestType = 'new_issue',
    String? preferredBranch,
    String? reason,
    String? cardType,
  }) async {
    try {
      return await primary.createCardRequest(
        requestType: requestType,
        preferredBranch: preferredBranch,
        reason: reason,
        cardType: cardType,
      );
    } catch (_) {
      return fallback.createCardRequest(
        requestType: requestType,
        preferredBranch: preferredBranch,
        reason: reason,
        cardType: cardType,
      );
    }
  }

  @override
  Future<CardRequestResult> requestReplacement(
    String cardId, {
    String? reason,
  }) async {
    try {
      return await primary.requestReplacement(cardId, reason: reason);
    } catch (_) {
      return fallback.requestReplacement(cardId, reason: reason);
    }
  }
}
