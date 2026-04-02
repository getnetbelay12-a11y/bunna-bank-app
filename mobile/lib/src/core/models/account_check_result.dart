class AccountCheckResult {
  const AccountCheckResult({
    required this.exists,
    required this.message,
    this.matchType,
  });

  final bool exists;
  final String message;
  final String? matchType;
}
