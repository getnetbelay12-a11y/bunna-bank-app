class VoteOption {
  const VoteOption({
    required this.optionId,
    required this.voteId,
    required this.name,
    required this.displayOrder,
    this.description,
  });

  final String optionId;
  final String voteId;
  final String name;
  final int displayOrder;
  final String? description;
}

class VoteDetail {
  const VoteDetail({
    required this.voteId,
    required this.title,
    required this.description,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.options,
  });

  final String voteId;
  final String title;
  final String description;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final List<VoteOption> options;
}
