class MemberProfile {
  const MemberProfile({
    required this.memberId,
    required this.customerId,
    required this.memberNumber,
    required this.fullName,
    required this.phone,
    required this.branchName,
    required this.memberType,
    required this.membershipStatus,
    required this.identityVerificationStatus,
  });

  final String memberId;
  final String customerId;
  final String memberNumber;
  final String fullName;
  final String phone;
  final String branchName;
  final String memberType;
  final String membershipStatus;
  final String identityVerificationStatus;
}
