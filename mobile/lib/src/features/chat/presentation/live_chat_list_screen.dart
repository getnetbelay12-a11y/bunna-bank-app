import 'dart:async';

import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_input.dart';
import '../../../shared/widgets/app_list_item.dart';
import '../../../shared/widgets/app_new_badge.dart';
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
    _conversationsFuture ??= AppScope.of(context).services.chatApi.fetchMyConversations();
    _pollTimer ??= Timer.periodic(const Duration(seconds: 8), (_) {
      if (mounted) {
        setState(() {
          _conversationsFuture = AppScope.of(context).services.chatApi.fetchMyConversations();
        });
      }
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
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    final content = FutureBuilder<List<ChatConversation>>(
      future: _conversationsFuture,
      builder: (context, snapshot) {
        final conversations = snapshot.data ?? const <ChatConversation>[];

        return RefreshIndicator(
          onRefresh: () async {
            final refreshed = services.chatApi.fetchMyConversations();
            setState(() {
              _conversationsFuture = refreshed;
            });
            await refreshed;
          },
          child: ListView(
            padding: EdgeInsets.fromLTRB(
              20,
              widget.embeddedInTab ? 12 : 20,
              20,
              24 + MediaQuery.of(context).viewInsets.bottom,
            ),
            children: [
              if (widget.embeddedInTab)
                const AppHeader(
                  title: 'Chat',
                  subtitle: 'Start a new support conversation or continue an existing one.',
                  trailing: AppNewBadge(),
                ),
              if (widget.embeddedInTab) const SizedBox(height: 16),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Start a new chat',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(width: 8),
                        const AppNewBadge(),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Choose the closest topic so the conversation reaches the right support desk faster.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedCategory,
                      items: _categories.entries
                          .map((entry) => DropdownMenuItem<String>(value: entry.key, child: Text(entry.value)))
                          .toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedCategory = value ?? 'general_help';
                        });
                      },
                      decoration: const InputDecoration(labelText: 'Issue category'),
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      controller: _messageController,
                      label: 'First message',
                      hintText: 'Briefly describe your issue',
                      minLines: 4,
                      maxLines: 5,
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      label: _creating ? 'Creating...' : 'Start Chat',
                      onPressed: _creating
                          ? null
                          : () async {
                              final initialMessage = _messageController.text.trim();
                              if (initialMessage.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Enter a message before starting chat.')),
                                );
                                return;
                              }
                              setState(() {
                                _creating = true;
                              });
                              try {
                                final conversation = await services.chatApi.createConversation(
                                  issueCategory: _selectedCategory,
                                  initialMessage: initialMessage,
                                );
                                if (!mounted) {
                                  return;
                                }
                                _messageController.clear();
                                setState(() {
                                  _creating = false;
                                  _conversationsFuture = services.chatApi.fetchMyConversations();
                                });
                                await navigator.push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => LiveChatDetailScreen(
                                      conversationId: conversation.id,
                                      initialConversation: conversation,
                                    ),
                                  ),
                                );
                              } catch (error) {
                                if (!mounted) {
                                  return;
                                }
                                setState(() {
                                  _creating = false;
                                });
                                messenger.showSnackBar(
                                  SnackBar(content: Text(_formatChatStartError(error, fallback: 'Unable to start chat right now.'))),
                                );
                              }
                            },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Recent conversations',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ),
                        Text(
                          '${conversations.length}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (snapshot.hasError)
                      const Text('Unable to load conversations. Pull to refresh.')
                    else if (conversations.isEmpty)
                      const Text('No conversations yet.')
                    else
                      for (var index = 0; index < conversations.length; index++) ...[
                        AppListItem(
                          title: _categories[conversations[index].issueCategory] ?? conversations[index].issueCategory,
                          subtitle: conversations[index].latestMessage?.message ?? 'No messages yet.',
                          icon: Icons.support_agent_outlined,
                          badge: _formatStatus(conversations[index].status),
                          badgeTone: _statusTone(conversations[index].status),
                          onTap: () async {
                            await Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => LiveChatDetailScreen(conversationId: conversations[index].id),
                              ),
                            );
                            if (mounted) {
                              setState(() {
                                _conversationsFuture = services.chatApi.fetchMyConversations();
                              });
                            }
                          },
                        ),
                        if (index != conversations.length - 1) const Divider(height: 1),
                      ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );

    if (widget.embeddedInTab) {
      return Material(color: Colors.white, child: SafeArea(top: false, child: content));
    }

    return AppScaffold(
      title: 'Live Chat',
      showBack: true,
      body: Material(color: Colors.white, child: SafeArea(top: false, child: content)),
    );
  }

  String _formatStatus(String value) => value.replaceAll('_', ' ');

  AppBadgeTone _statusTone(String value) {
    switch (value) {
      case 'resolved':
        return AppBadgeTone.success;
      case 'assigned':
      case 'open':
        return AppBadgeTone.primary;
      case 'waiting_customer':
        return AppBadgeTone.warning;
      default:
        return AppBadgeTone.neutral;
    }
  }
}

String _formatChatStartError(Object error, {required String fallback}) {
  final text = error.toString().replaceFirst('Exception: ', '').trim();
  return text.isEmpty ? fallback : text;
}
