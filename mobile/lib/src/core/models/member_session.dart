class MemberFeatureFlags {
  const MemberFeatureFlags({
    required this.voting,
    required this.announcements,
    required this.dividends,
    required this.schoolPayment,
    required this.loans,
    required this.savings,
    required this.liveChat,
  });

  const MemberFeatureFlags.defaults({
    this.voting = false,
    this.announcements = false,
    this.dividends = false,
    this.schoolPayment = true,
    this.loans = true,
    this.savings = true,
    this.liveChat = true,
  });

  final bool voting;
  final bool announcements;
  final bool dividends;
  final bool schoolPayment;
  final bool loans;
  final bool savings;
  final bool liveChat;
}

enum MemberType {
  shareholder,
  member,
}

class MemberSession {
  const MemberSession({
    required this.memberId,
    required this.customerId,
    required this.fullName,
    required this.phone,
    required this.memberType,
    required this.branchName,
    required this.membershipStatus,
    required this.identityVerificationStatus,
    required this.featureFlags,
  });

  final String memberId;
  final String customerId;
  final String fullName;
  final String phone;
  final MemberType memberType;
  final String branchName;
  final String membershipStatus;
  final String identityVerificationStatus;
  final MemberFeatureFlags featureFlags;

  bool get canVote => featureFlags.voting;
  bool get isShareholder => memberType == MemberType.shareholder;
  bool get canUseLiveChat => featureFlags.liveChat;
}
