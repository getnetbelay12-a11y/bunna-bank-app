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
    bool consentAccepted = true,
  });
  Future<MemberSession> login({
    required String customerId,
    required String password,
  });
  Future<Map<String, dynamic>> requestOtp(String phoneNumber);
  Future<Map<String, dynamic>> verifyOtp({
    required String phoneNumber,
    required String otpCode,
  });
  Future<void> logout();
}

abstract class MemberApi {
  Future<MemberProfile> fetchMyProfile(String memberId);
}

abstract class SavingsApi {
  Future<List<SavingsAccount>> fetchMyAccounts(String memberId);
  Future<List<AccountTransaction>> fetchAccountTransactions(String accountId);
}

abstract class SchoolPaymentApi {
  Future<SchoolPaymentResult> createSchoolPayment({
    required String accountId,
    required String studentId,
    required String schoolName,
    required double amount,
    required String channel,
    String? narration,
  });
  Future<List<Map<String, dynamic>>> fetchMySchoolPayments();
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
}

abstract class NotificationApi {
  Future<List<AppNotification>> fetchMyNotifications();
  Future<AppNotification> markAsRead(String notificationId);
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
    String? initialMessage,
  });
  Future<ChatConversation> fetchConversation(String conversationId);
  Future<ChatConversation> sendMessage(
    String conversationId, {
    required String message,
  });
}

abstract class VotingApi {
  Future<List<VoteSummary>> fetchActiveVotes();
  Future<Map<String, dynamic>> submitVote(
    String voteId, {
    required String optionId,
    required String encryptedBallot,
    required String otpCode,
  });
}
