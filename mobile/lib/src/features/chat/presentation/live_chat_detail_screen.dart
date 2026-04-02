import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';

class LiveChatDetailScreen extends StatefulWidget {
  const LiveChatDetailScreen({
    super.key,
    required this.conversationId,
    this.initialConversation,
  });

  final String conversationId;
  final ChatConversation? initialConversation;

  @override
  State<LiveChatDetailScreen> createState() => _LiveChatDetailScreenState();
}

class _LiveChatDetailScreenState extends State<LiveChatDetailScreen> {
  final _messageController = TextEditingController();
  ChatConversation? _conversation;
  bool _sending = false;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _conversation = widget.initialConversation;
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted) {
        return;
      }
      _refreshConversation(silent: true);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Live Chat'),
      ),
      body: FutureBuilder<ChatConversation>(
        future: _conversation == null
            ? services.chatApi.fetchConversation(widget.conversationId)
            : Future<ChatConversation>.value(_conversation),
        builder: (context, snapshot) {
          final conversation = snapshot.data ?? _conversation;

          if (snapshot.hasError && conversation == null) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Unable to load this conversation right now. Pull back and try again.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          if (conversation == null) {
            return const Center(child: CircularProgressIndicator());
          }

          final messages = conversation.messages;

          return SafeArea(
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F1FF),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${_formatStatus(conversation.status)} • ${conversation.issueCategory.replaceAll('_', ' ')}',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: cbeBlue,
                                    fontWeight: FontWeight.w700,
                                  ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => _refreshConversation(),
                        icon: const Icon(Icons.refresh_rounded),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: messages.isEmpty
                      ? const Center(
                          child: Text('No messages yet. Start the conversation below.'),
                        )
                      : ListView.builder(
                          reverse: true,
                          padding: const EdgeInsets.all(16),
                          itemCount: messages.length,
                          itemBuilder: (context, index) {
                            final item = messages[messages.length - 1 - index];
                            final isCustomer = item.senderType == 'customer';

                            return Align(
                              alignment: isCustomer
                                  ? Alignment.centerRight
                                  : Alignment.centerLeft,
                              child: Container(
                                constraints: const BoxConstraints(maxWidth: 320),
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: isCustomer ? cbeBlue : Colors.white,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: isCustomer
                                        ? cbeBlue
                                        : const Color(0xFFD8E3F5),
                                  ),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Color(0x0A000000),
                                      blurRadius: 8,
                                      offset: Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.senderName?.isNotEmpty == true
                                          ? item.senderName!
                                          : item.senderType.toUpperCase(),
                                      style: Theme.of(context)
                                          .textTheme
                                          .labelLarge
                                          ?.copyWith(
                                            color: isCustomer
                                                ? const Color(0xFFD6E4FF)
                                                : const Color(0xFF475569),
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      item.message,
                                      style: TextStyle(
                                        color: isCustomer ? Colors.white : null,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      _formatTimestamp(item.createdAt),
                                      style: Theme.of(context)
                                          .textTheme
                                          .labelSmall
                                          ?.copyWith(
                                            color: isCustomer
                                                ? const Color(0xFFD6E4FF)
                                                : const Color(0xFF64748B),
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
                AnimatedPadding(
                  duration: const Duration(milliseconds: 180),
                  padding: EdgeInsets.fromLTRB(
                    16,
                    16,
                    16,
                    16 + MediaQuery.of(context).viewInsets.bottom,
                  ),
                  child: SafeArea(
                    top: false,
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _messageController,
                            minLines: 1,
                            maxLines: 4,
                            decoration: const InputDecoration(
                              hintText: 'Write a message',
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        FilledButton(
                          onPressed: _sending
                              ? null
                              : () async {
                                  final value = _messageController.text.trim();
                                  if (value.isEmpty) {
                                    return;
                                  }

                                  setState(() {
                                    _sending = true;
                                  });
                                  final messenger =
                                      ScaffoldMessenger.of(context);

                                  try {
                                    final updated =
                                        await services.chatApi.sendMessage(
                                      conversation.id,
                                      message: value,
                                    );

                                    _messageController.clear();
                                    setState(() {
                                      _conversation = updated;
                                      _sending = false;
                                    });
                                  } catch (error) {
                                    if (!mounted) {
                                      return;
                                    }
                                    setState(() {
                                      _sending = false;
                                    });
                                    messenger.showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          _formatChatError(
                                            error,
                                            fallback:
                                                'Unable to send your message right now.',
                                          ),
                                        ),
                                      ),
                                    );
                                  }
                                },
                          child: Text(_sending ? 'Sending...' : 'Send'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _refreshConversation({bool silent = false}) async {
    try {
      final updated = await AppScope.of(context)
          .services
          .chatApi
          .fetchConversation(widget.conversationId);
      if (!mounted) {
        return;
      }
      setState(() {
        _conversation = updated;
      });
    } catch (_) {
      if (!silent && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Unable to refresh chat right now.'),
          ),
        );
      }
    }
  }

  String _formatStatus(String value) =>
      value.replaceAll('_', ' ').toUpperCase();

  String _formatTimestamp(DateTime value) {
    final hour = value.hour.toString().padLeft(2, '0');
    final minute = value.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

String _formatChatError(Object error, {required String fallback}) {
  final text = error.toString().replaceFirst('Exception: ', '').trim();
  if (text.isEmpty) {
    return fallback;
  }
  return text;
}
