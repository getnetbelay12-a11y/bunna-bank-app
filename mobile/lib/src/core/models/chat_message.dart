class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderType,
    required this.message,
    required this.messageType,
    required this.createdAt,
    this.senderId,
    this.senderName,
  });

  final String id;
  final String conversationId;
  final String senderType;
  final String? senderId;
  final String? senderName;
  final String message;
  final String messageType;
  final DateTime createdAt;
}
