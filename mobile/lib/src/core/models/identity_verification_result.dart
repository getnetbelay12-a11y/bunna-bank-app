class IdentityVerificationResult {
  const IdentityVerificationResult({
    required this.memberId,
    required this.phoneNumber,
    required this.verificationStatus,
    required this.verificationMethod,
    this.faydaFin,
    this.faydaAlias,
    this.qrDataRaw,
    this.verificationReference,
    this.failureReason,
  });

  final String memberId;
  final String phoneNumber;
  final String verificationStatus;
  final String verificationMethod;
  final String? faydaFin;
  final String? faydaAlias;
  final String? qrDataRaw;
  final String? verificationReference;
  final String? failureReason;
}
