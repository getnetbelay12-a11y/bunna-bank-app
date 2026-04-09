class LoanSummary {
  const LoanSummary({
    required this.loanId,
    required this.loanType,
    required this.amount,
    required this.interestRate,
    required this.termMonths,
    required this.status,
    required this.currentLevel,
    this.deficiencyReasons = const [],
    this.purpose,
    this.createdAt,
  });

  final String loanId;
  final String loanType;
  final double amount;
  final double interestRate;
  final int termMonths;
  final String status;
  final String currentLevel;
  final List<String> deficiencyReasons;
  final String? purpose;
  final DateTime? createdAt;

  bool get isRepaymentActive => status == 'approved' || status == 'disbursed';

  double get estimatedMonthlyPayment {
    if (termMonths <= 0) {
      return amount;
    }

    final monthlyRate = interestRate <= 0 ? 0.0 : interestRate / 12 / 100;
    if (monthlyRate == 0) {
      return amount / termMonths;
    }

    final factor = _pow(1 + monthlyRate, termMonths.toDouble());
    return amount * monthlyRate * factor / (factor - 1);
  }

  int get elapsedPaymentMonths {
    if (createdAt == null || termMonths <= 0 || !isRepaymentActive) {
      return 0;
    }

    final now = DateTime.now();
    var months = (now.year - createdAt!.year) * 12 + (now.month - createdAt!.month);
    if (now.day < createdAt!.day) {
      months -= 1;
    }

    return months.clamp(0, termMonths);
  }

  double get estimatedRemainingBalance {
    if (!isRepaymentActive) {
      return amount;
    }

    final paid = estimatedMonthlyPayment * elapsedPaymentMonths;
    final totalExpected = estimatedMonthlyPayment * termMonths;
    final remaining = totalExpected - paid;
    return remaining < 0
        ? 0
        : remaining > totalExpected
        ? totalExpected
        : remaining;
  }

  DateTime? get nextPaymentDate {
    if (!isRepaymentActive || createdAt == null) {
      return null;
    }

    final base = DateTime(
      createdAt!.year,
      createdAt!.month + elapsedPaymentMonths + 1,
      createdAt!.day,
    );
    return base;
  }

  static double _pow(double base, double exponent) {
    var result = 1.0;
    for (var i = 0; i < exponent.toInt(); i += 1) {
      result *= base;
    }
    return result;
  }
}
