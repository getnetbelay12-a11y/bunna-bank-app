class VoteSummary {
  const VoteSummary({
    required this.voteId,
    required this.title,
    required this.description,
    required this.status,
    required this.startDate,
    required this.endDate,
  });

  final String voteId;
  final String title;
  final String description;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
}
