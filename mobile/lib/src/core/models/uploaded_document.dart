class UploadedDocument {
  const UploadedDocument({
    required this.storageKey,
    required this.originalFileName,
    required this.provider,
    required this.entityId,
    this.mimeType,
    this.sizeBytes,
  });

  final String storageKey;
  final String originalFileName;
  final String provider;
  final String entityId;
  final String? mimeType;
  final int? sizeBytes;
}
