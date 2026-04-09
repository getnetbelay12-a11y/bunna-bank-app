class SecurityOverview {
  const SecurityOverview({
    required this.accountLockEnabled,
    required this.highRiskActionVerification,
    required this.sessions,
    required this.devices,
  });

  final bool accountLockEnabled;
  final bool highRiskActionVerification;
  final List<MemberAuthSession> sessions;
  final List<MemberDevice> devices;
}

class MemberAuthSession {
  const MemberAuthSession({
    required this.challengeId,
    required this.loginIdentifier,
    required this.status,
    required this.isCurrent,
    this.deviceId,
    this.expiresAt,
    this.verifiedAt,
    this.loggedOutAt,
    this.updatedAt,
  });

  final String challengeId;
  final String loginIdentifier;
  final String status;
  final bool isCurrent;
  final String? deviceId;
  final DateTime? expiresAt;
  final DateTime? verifiedAt;
  final DateTime? loggedOutAt;
  final DateTime? updatedAt;
}

class MemberDevice {
  const MemberDevice({
    required this.deviceId,
    required this.rememberDevice,
    required this.biometricEnabled,
    required this.isCurrent,
    this.lastLoginAt,
    this.updatedAt,
  });

  final String deviceId;
  final bool rememberDevice;
  final bool biometricEnabled;
  final bool isCurrent;
  final DateTime? lastLoginAt;
  final DateTime? updatedAt;
}
