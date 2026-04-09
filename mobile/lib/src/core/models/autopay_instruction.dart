class AutopayInstruction {
  const AutopayInstruction({
    required this.id,
    required this.serviceType,
    required this.accountId,
    required this.schedule,
    required this.enabled,
  });

  final String id;
  final String serviceType;
  final String accountId;
  final String schedule;
  final bool enabled;
}
