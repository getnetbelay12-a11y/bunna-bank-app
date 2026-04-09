class OnboardingStatus {
  const OnboardingStatus({
    required this.customerId,
    required this.phoneNumber,
    required this.onboardingReviewStatus,
    required this.membershipStatus,
    required this.identityVerificationStatus,
    required this.requiredAction,
    required this.statusMessage,
    this.branchName,
    this.reviewNote,
    this.lastUpdatedAt,
  });

  final String customerId;
  final String phoneNumber;
  final String onboardingReviewStatus;
  final String membershipStatus;
  final String identityVerificationStatus;
  final String requiredAction;
  final String statusMessage;
  final String? branchName;
  final String? reviewNote;
  final DateTime? lastUpdatedAt;
}
