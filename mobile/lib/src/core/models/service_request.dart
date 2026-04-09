class ServiceRequest {
  const ServiceRequest({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.status,
    required this.createdAt,
    this.latestNote,
    this.payload = const {},
    this.attachments = const [],
    this.timeline = const [],
  });

  final String id;
  final String type;
  final String title;
  final String description;
  final String status;
  final DateTime createdAt;
  final String? latestNote;
  final Map<String, dynamic> payload;
  final List<String> attachments;
  final List<ServiceRequestEvent> timeline;
}

class ServiceRequestEvent {
  const ServiceRequestEvent({
    required this.id,
    required this.eventType,
    required this.actorType,
    this.actorName,
    this.note,
    this.toStatus,
    this.createdAt,
  });

  final String id;
  final String eventType;
  final String actorType;
  final String? actorName;
  final String? note;
  final String? toStatus;
  final DateTime? createdAt;
}
