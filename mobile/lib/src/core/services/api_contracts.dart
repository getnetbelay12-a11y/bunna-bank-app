import '../models/index.dart';

abstract class AuthApi {
  Future<LoginChallenge> startLogin({
    required String identifier,
    String? deviceId,
  });
  Future<MemberSession> verifyPin({
    required String challengeId,
    required String pin,
    bool rememberDevice = false,
    bool biometricEnabled = false,
    String? deviceId,
  });
  Future<AccountCheckResult> checkExistingAccount({
    required String phoneNumber,
    String? faydaFin,
    String? email,
  });
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
    FaydaExtractionResult? extractedFaydaData,
    bool consentAccepted = true,
  });
  Future<MemberSession> login({
    required String customerId,
    required String password,
  });
  Future<Map<String, dynamic>> requestOtp({
    required String phoneNumber,
    String? email,
    String preferredChannel = 'sms',
    String? purpose,
  });
  Future<Map<String, dynamic>> verifyOtp({
    required String phoneNumber,
    required String otpCode,
  });
  Future<OnboardingStatus> getOnboardingStatus({
    required String customerId,
    required String phoneNumber,
  });
  Future<Map<String, dynamic>> resetPin({
    required String phoneNumber,
    String? email,
    required String newPin,
    required String confirmPin,
  });
  Future<PinRecoveryOptions> getPinRecoveryOptions({
    required String identifier,
  });
  Future<MemberSession?> restoreSession();
  Future<void> logout();
}

abstract class MemberApi {
  Future<MemberProfile> fetchMyProfile(String memberId);
}

abstract class ShareholderApi {
  Future<ShareholderProfile> fetchMyShareholderProfile();
}

abstract class RecommendationApi {
  Future<List<SmartRecommendation>> fetchMyRecommendations();
  Future<void> markViewed(String recommendationId);
  Future<void> dismiss(String recommendationId);
  Future<void> act(String recommendationId, {bool completed = false});
}

abstract class InsightApi {
  Future<SmartInsightFeed> fetchMyInsights();
  Future<SmartInsightFeed> fetchMyHomeInsights();
}

abstract class SavingsApi {
  Future<List<SavingsAccount>> fetchMyAccounts(String memberId);
  Future<List<AccountTransaction>> fetchAccountTransactions(String accountId);
}

abstract class SchoolPaymentApi {
  Future<List<Map<String, dynamic>>> fetchMyLinkedStudents();
  Future<SchoolPaymentResult> createSchoolPayment({
    required String accountId,
    required String studentId,
    required String schoolName,
    required double amount,
    required String channel,
    String? narration,
  });
  Future<QrPaymentResult> createQrPayment({
    required String accountId,
    required String qrPayload,
    required String merchantName,
    required double amount,
    String? narration,
  });
  Future<List<Map<String, dynamic>>> fetchMySchoolPayments();
  Future<PaymentActivitySummary?> fetchMyPaymentActivity();
  Future<List<PaymentReceiptItem>> fetchMyPaymentReceipts();
}

abstract class LoanApi {
  Future<LoanSummary> submitLoanApplication({
    required String loanType,
    required double amount,
    required double interestRate,
    required int termMonths,
    required String purpose,
  });
  Future<List<LoanSummary>> fetchMyLoans();
  Future<LoanSummary> fetchLoanDetail(String loanId);
  Future<List<LoanTimelineItem>> fetchLoanTimeline(String loanId);
  Future<Map<String, dynamic>> uploadLoanDocument(
    String loanId, {
    required String documentType,
    required String originalFileName,
    String? storageKey,
    String? mimeType,
    int? sizeBytes,
  });
}

abstract class NotificationApi {
  Future<List<AppNotification>> fetchMyNotifications();
  Future<AppNotification> markAsRead(String notificationId);
  Future<void> registerDeviceToken({
    required String deviceId,
    required String platform,
    required String token,
    required String appVersion,
  });
}

abstract class DocumentUploadApi {
  Future<UploadedDocument> uploadDocument({
    required String filePath,
    required String originalFileName,
    required String domain,
    String? entityId,
    String? documentType,
  });
}

abstract class FaydaPrefillApi {
  Future<FaydaExtractionResult> extractFromDocuments({
    required String frontDocumentPath,
    required String backDocumentPath,
  });
}

abstract class IdentityVerificationApi {
  Future<IdentityVerificationResult> getStatus();
  Future<IdentityVerificationResult> submitFin({
    required String faydaFin,
    String? faydaAlias,
  });
  Future<IdentityVerificationResult> uploadQr({
    String? qrDataRaw,
    String? faydaAlias,
  });
  Future<IdentityVerificationResult> verify();
}

abstract class LocationApi {
  Future<List<String>> fetchRegions();
  Future<List<String>> fetchCities(String region);
  Future<List<LocationBranchOption>> fetchBranches({
    required String region,
    required String city,
  });
}

abstract class ChatApi {
  Future<List<ChatConversation>> fetchMyConversations();
  Future<ChatConversation> createConversation({
    required String issueCategory,
    String? loanId,
    String? initialMessage,
  });
  Future<ChatConversation> fetchConversation(String conversationId);
  Future<ChatConversation> sendMessage(
    String conversationId, {
    required String message,
  });
}

abstract class AutopayApi {
  Future<List<AutopayInstruction>> fetchInstructions();
  Future<AutopayInstruction> createInstruction({
    required String provider,
    required String accountId,
    required String schedule,
  });
  Future<AutopayInstruction> updateInstructionStatus({
    String? id,
    String? provider,
    required bool enabled,
  });
}

abstract class SecurityApi {
  Future<SecurityOverview> fetchOverview();
  Future<bool> updateAccountLock(bool enabled);
  Future<void> revokeSession(String challengeId);
}

abstract class CardApi {
  Future<List<CardItem>> fetchMyCards();
  Future<CardItem> lockCard(String cardId);
  Future<CardItem> unlockCard(String cardId);
  Future<CardRequestResult> createCardRequest({
    String requestType = 'new_issue',
    String? preferredBranch,
    String? reason,
    String? cardType,
  });
  Future<CardRequestResult> requestReplacement(
    String cardId, {
    String? reason,
  });
}

abstract class ServiceRequestApi {
  Future<List<ServiceRequest>> fetchMyRequests();
  Future<ServiceRequest> fetchRequestDetail(String requestId);
  Future<ServiceRequest> createRequest({
    required String type,
    required String title,
    required String description,
    Map<String, dynamic>? payload,
    List<String>? attachments,
  });
}

abstract class VotingApi {
  Future<List<VoteSummary>> fetchActiveVotes();
  Future<VoteDetail> fetchVoteDetail(String voteId);
  Future<Map<String, dynamic>> submitVote(
    String voteId, {
    required String optionId,
    required String encryptedBallot,
    required String otpCode,
  });
}
