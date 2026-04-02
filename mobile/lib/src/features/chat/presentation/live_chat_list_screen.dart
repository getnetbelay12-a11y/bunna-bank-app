import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import 'live_chat_detail_screen.dart';

class LiveChatListScreen extends StatefulWidget {
  const LiveChatListScreen({
    super.key,
    this.embeddedInTab = false,
  });

  final bool embeddedInTab;

  @override
  State<LiveChatListScreen> createState() => _LiveChatListScreenState();
}

class _LiveChatListScreenState extends State<LiveChatListScreen> {
  static const _categories = <String, String>{
    'loan_issue': 'Loan issue',
    'payment_issue': 'Payment issue',
    'insurance_issue': 'Insurance issue',
    'kyc_issue': 'KYC issue',
    'general_help': 'General help',
  };

  String _selectedCategory = 'general_help';
  final _messageController = TextEditingController();
  bool _creating = false;
  Future<List<ChatConversation>>? _conversationsFuture;
  Timer? _pollTimer;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _conversationsFuture ??=
        AppScope.of(context).services.chatApi.fetchMyConversations();
    _pollTimer ??= Timer.periodic(const Duration(seconds: 8), (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _conversationsFuture =
            AppScope.of(context).services.chatApi.fetchMyConversations();
      });
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final content = FutureBuilder<List<ChatConversation>>(
      future: _conversationsFuture,
      builder: (context, snapshot) {
        final conversations = snapshot.data ?? const <ChatConversation>[];

        return SafeArea(
          top: !widget.embeddedInTab,
          child: RefreshIndicator(
            onRefresh: () async {
              final refreshed = services.chatApi.fetchMyConversations();
              setState(() {
                _conversationsFuture = refreshed;
              });
              await refreshed;
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(
                20,
                widget.embeddedInTab ? 16 : 20,
                20,
                20 + MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (widget.embeddedInTab) ...[
                    Text(
                      'Live Chat',
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Start support quickly, review recent conversations, and continue replies from the same thread used by the support console.',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                    ),
                    const SizedBox(height: 20),
                  ],
                  Text(
                    'Start support quickly, choose the issue category, and send your first message to the same queue used by the support console.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: const Color(0xFF64748B),
                        ),
                  ),
                  const SizedBox(height: 20),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedCategory,
                    dropdownColor: Colors.white,
                    decoration: InputDecoration(
                      labelText: 'Issue category',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: const BorderSide(color: Color(0xFFD8E3F5)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: const BorderSide(color: Color(0xFFD8E3F5)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: const BorderSide(color: cbeBlue),
                      ),
                    ),
                    items: _categories.entries
                        .map(
                          (entry) => DropdownMenuItem<String>(
                            value: entry.key,
                            child: Text(entry.value),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedCategory = value ?? 'general_help';
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _messageController,
                    minLines: 4,
                    maxLines: 5,
                    decoration: InputDecoration(
                      hintText: 'Briefly describe your issue',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.all(16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: const BorderSide(color: Color(0xFFD8E3F5)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: const BorderSide(color: Color(0xFFD8E3F5)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: const BorderSide(color: cbeBlue),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _creating
                          ? null
                          : () async {
                              final initialMessage =
                                  _messageController.text.trim();
                              if (initialMessage.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Enter a message before starting live chat.',
                                    ),
                                  ),
                                );
                                return;
                              }

                              setState(() {
                                _creating = true;
                              });

                              try {
                                final conversation =
                                    await services.chatApi.createConversation(
                                  issueCategory: _selectedCategory,
                                  initialMessage: initialMessage,
                                );

                                if (!context.mounted) {
                                  return;
                                }

                                _messageController.clear();
                                setState(() {
                                  _creating = false;
                                  _conversationsFuture =
                                      services.chatApi.fetchMyConversations();
                                });

                                await Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => LiveChatDetailScreen(
                                      conversationId: conversation.id,
                                      initialConversation: conversation,
                                    ),
                                  ),
                                );

                                if (!context.mounted) {
                                  return;
                                }
                                setState(() {
                                  _conversationsFuture =
                                      services.chatApi.fetchMyConversations();
                                });
                              } catch (error) {
                                if (!context.mounted) {
                                  return;
                                }
                                setState(() {
                                  _creating = false;
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      _formatChatStartError(
                                        error,
                                        fallback:
                                            'Unable to start support chat right now.',
                                      ),
                                    ),
                                  ),
                                );
                              }
                            },
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      child: Text(
                        _creating ? 'Creating...' : 'Start Live Chat',
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Divider(height: 1),
                  const SizedBox(height: 24),
                  Text(
                    'Recent Conversations',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 12),
                  if (snapshot.hasError)
                    const Card(
                      child: ListTile(
                        title: Text('Unable to load conversations'),
                        subtitle: Text(
                          'Pull to refresh or start a new chat.',
                        ),
                      ),
                    )
                  else if (conversations.isEmpty)
                    const Card(
                      child: ListTile(
                        leading: Icon(Icons.chat_bubble_outline_rounded),
                        title: Text('No conversations yet'),
                        subtitle: Text('Tap Start Live Chat to begin.'),
                      ),
                    )
                  else
                    for (final conversation in conversations)
                      Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEAF2FF),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(
                              Icons.support_agent_rounded,
                              color: cbeBlue,
                            ),
                          ),
                          title: Text(
                            _categories[conversation.issueCategory] ??
                                conversation.issueCategory,
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                conversation.latestMessage?.message ??
                                    'No messages yet.',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${conversation.memberName} • ${conversation.branchName ?? 'Bunna Bank'}',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(color: const Color(0xFF64748B)),
                              ),
                            ],
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                _formatStatus(conversation.status),
                                style: Theme.of(context)
                                    .textTheme
                                    .labelMedium
                                    ?.copyWith(
                                      color: cbeBlue,
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _formatTime(conversation.updatedAt),
                                style: Theme.of(context).textTheme.labelSmall,
                              ),
                            ],
                          ),
                          onTap: () async {
                            await Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => LiveChatDetailScreen(
                                  conversationId: conversation.id,
                                ),
                              ),
                            );
                            if (!context.mounted) {
                              return;
                            }
                            setState(() {
                              _conversationsFuture =
                                  services.chatApi.fetchMyConversations();
                            });
                          },
                        ),
                      ),
                ],
              ),
            ),
          ),
        );
      },
    );

    if (widget.embeddedInTab) {
      return Material(
        color: const Color(0xFFF5F7FB),
        child: content,
      );
    }

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Live Chat'),
      ),
      body: Material(
        color: const Color(0xFFF5F7FB),
        child: content,
      ),
    );
  }

  String _formatStatus(String value) =>
      value.replaceAll('_', ' ').toUpperCase();

  String _formatTime(DateTime value) {
    final hour = value.hour.toString().padLeft(2, '0');
    final minute = value.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

String _formatChatStartError(Object error, {required String fallback}) {
  final text = error.toString().replaceFirst('Exception: ', '').trim();
  if (text.isEmpty) {
    return fallback;
  }
  return text;
}
