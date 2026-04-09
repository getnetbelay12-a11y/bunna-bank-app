class LoanTimelineItem {
  const LoanTimelineItem({
    required this.status,
    required this.title,
    required this.description,
    required this.isCompleted,
    this.isCurrent = false,
  });

  final String status;
  final String title;
  final String description;
  final bool isCompleted;
  final bool isCurrent;
}
