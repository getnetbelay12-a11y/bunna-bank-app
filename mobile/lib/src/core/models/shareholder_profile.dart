class ShareholderProfile {
  const ShareholderProfile({
    required this.memberId,
    required this.shareholderId,
    required this.memberNumber,
    required this.fullName,
    required this.phone,
    required this.totalShares,
    required this.status,
    this.memberSince,
  });

  final String memberId;
  final String shareholderId;
  final String memberNumber;
  final String fullName;
  final String phone;
  final double totalShares;
  final String status;
  final DateTime? memberSince;
}
