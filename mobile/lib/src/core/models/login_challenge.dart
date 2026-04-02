class LoginChallenge {
  const LoginChallenge({
    required this.challengeId,
    required this.expiresAt,
  });

  final String challengeId;
  final DateTime expiresAt;
}
