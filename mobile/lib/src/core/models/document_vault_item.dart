class DocumentVaultItem {
  const DocumentVaultItem({
    required this.id,
    required this.title,
    required this.category,
    required this.status,
    required this.issuedAt,
    this.description,
  });

  final String id;
  final String title;
  final String category;
  final String status;
  final DateTime issuedAt;
  final String? description;
}
