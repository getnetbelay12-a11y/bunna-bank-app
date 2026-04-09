import 'chat_message.dart';

class ChatConversation {
  const ChatConversation({
    required this.id,
    required this.memberName,
    required this.phoneNumber,
    required this.status,
    required this.issueCategory,
    required this.channel,
    required this.createdAt,
    required this.updatedAt,
    required this.escalationFlag,
    required this.priority,
    this.loanId,
    this.routingLevel,
    this.branchName,
    this.assignedToStaffName,
    this.assignedAgentId,
    this.latestMessage,
    this.messages = const [],
    this.responseDueAt,
    this.slaState,
  });

  final String id;
  final String memberName;
  final String phoneNumber;
  final String status;
  final String issueCategory;
  final String channel;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool escalationFlag;
  final String priority;
  final String? loanId;
  final String? routingLevel;
  final String? branchName;
  final String? assignedToStaffName;
  final String? assignedAgentId;
  final ChatMessage? latestMessage;
  final List<ChatMessage> messages;
  final DateTime? responseDueAt;
  final String? slaState;
}
