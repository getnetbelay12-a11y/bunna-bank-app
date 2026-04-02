class SavingsAccount {
  const SavingsAccount({
    required this.accountId,
    required this.accountNumber,
    required this.balance,
    required this.currency,
    required this.isActive,
  });

  final String accountId;
  final String accountNumber;
  final double balance;
  final String currency;
  final bool isActive;
}
