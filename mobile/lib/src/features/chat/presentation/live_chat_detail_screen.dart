import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_input.dart';

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
      if (mounted) {
        _refreshConversation(silent: true);
      }
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

    return AppScaffold(
      title: 'Live Chat',
      showBack: true,
      resizeToAvoidBottomInset: true,
      body: FutureBuilder<ChatConversation>(
        future: _conversation == null
            ? services.chatApi.fetchConversation(widget.conversationId)
            : Future<ChatConversation>.value(_conversation),
        builder: (context, snapshot) {
          final conversation = snapshot.data ?? _conversation;

          if (snapshot.hasError && conversation == null) {
            return const SafeArea(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'Unable to load this conversation right now. Pull back and try again.',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            );
          }

          if (conversation == null) {
            return const SafeArea(
              child: Center(child: CircularProgressIndicator()),
            );
          }

          final messages = conversation.messages;

          return SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: AppCard(
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Support Conversation',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  AppBadge(
                                    label: _formatStatus(conversation.status),
                                    tone: _statusTone(conversation.status),
                                  ),
                                  AppBadge(
                                    label: conversation.issueCategory
                                        .replaceAll('_', ' '),
                                    tone: AppBadgeTone.neutral,
                                  ),
                                  AppBadge(
                                    label: '${messages.length} messages',
                                    tone: AppBadgeTone.neutral,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => _refreshConversation(),
                          icon: const Icon(Icons.refresh_rounded),
                        ),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  child: messages.isEmpty
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'No messages yet. Start the conversation below.',
                              textAlign: TextAlign.center,
                            ),
                          ),
                        )
                      : ListView.builder(
                          reverse: true,
                          padding: const EdgeInsets.all(20),
                          itemCount: messages.length,
                          itemBuilder: (context, index) {
                            final item = messages[messages.length - 1 - index];
                            final isCustomer = item.senderType == 'customer';

                            return Align(
                              alignment: isCustomer
                                  ? Alignment.centerRight
                                  : Alignment.centerLeft,
                              child: Container(
                                constraints:
                                    const BoxConstraints(maxWidth: 320),
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: isCustomer
                                      ? abayPrimary
                                      : abaySurfaceElevated,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isCustomer
                                        ? abayPrimary
                                        : abayBorder,
                                  ),
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
                                                ? Colors.white
                                                : abayPrimary,
                                          ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      item.message,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            color: isCustomer
                                                ? Colors.white
                                                : abayText,
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
                                                ? Colors.white70
                                                : abayTextSoft,
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
                    20,
                    12,
                    20,
                    20 + MediaQuery.of(context).viewInsets.bottom,
                  ),
                  child: SafeArea(
                    top: false,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: AppCard(
                            padding: const EdgeInsets.all(12),
                            child: AppInput(
                              controller: _messageController,
                              hintText: 'Write a message',
                              label: 'Reply',
                              minLines: 1,
                              maxLines: 4,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        SizedBox(
                          width: 112,
                          child: AppButton(
                            label: _sending ? 'Sending...' : 'Send',
                            onPressed: _sending
                                ? null
                                : () async {
                                    final value =
                                        _messageController.text.trim();
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
                                      if (!mounted) {
                                        return;
                                      }
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
                          ),
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

  AppBadgeTone _statusTone(String value) {
    switch (value) {
      case 'resolved':
        return AppBadgeTone.success;
      case 'assigned':
      case 'open':
        return AppBadgeTone.primary;
      default:
        return AppBadgeTone.neutral;
    }
  }

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
