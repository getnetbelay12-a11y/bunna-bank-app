class LoanSummary {
  const LoanSummary({
    required this.loanId,
    required this.loanType,
    required this.amount,
    required this.status,
    required this.currentLevel,
    this.purpose,
  });

  final String loanId;
  final String loanType;
  final double amount;
  final String status;
  final String currentLevel;
  final String? purpose;
}
