import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_list_item.dart';
import '../../../shared/widgets/app_new_badge.dart';
import 'notification_display.dart';
import 'notification_navigation.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final showBack = Navigator.of(context).canPop();

    return FutureBuilder<List<AppNotification>>(
      future: services.notificationApi.fetchMyNotifications(),
      builder: (context, snapshot) {
        final items = snapshot.data ?? const <AppNotification>[];
        final now = DateTime.now();
        final today = items.where((item) => DateUtils.isSameDay(item.createdAt, now)).toList();
        final earlier = items.where((item) => !DateUtils.isSameDay(item.createdAt, now)).toList();

        final unreadCount = items.where((item) => item.status != 'read').length;

        return AppScaffold(
          title: 'Notifications',
          showBack: showBack,
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              AppHeader(
                title: 'Notification Center',
                subtitle: 'Loan, payment, support, security, and shareholder alerts are stored here.',
                trailing: unreadCount > 0 ? const AppNewBadge() : null,
              ),
              const SizedBox(height: 16),
              if (items.isNotEmpty)
                AppCard(
                  child: Row(
                    children: [
                      Expanded(
                        child: _InboxSummary(
                          label: 'Unread',
                          value: '$unreadCount',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _InboxSummary(
                          label: 'Total',
                          value: '${items.length}',
                        ),
                      ),
                    ],
                  ),
                ),
              if (items.isNotEmpty) const SizedBox(height: 16),
              if (today.isNotEmpty) _NotificationSection(title: 'Today', items: today),
              if (today.isNotEmpty && earlier.isNotEmpty) const SizedBox(height: 16),
              if (earlier.isNotEmpty) _NotificationSection(title: 'Earlier', items: earlier),
              if (items.isEmpty)
                const AppCard(
                  child: Text('Notifications will appear here when there are new updates.'),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _InboxSummary extends StatelessWidget {
  const _InboxSummary({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
      ],
    );
  }
}

class _NotificationSection extends StatelessWidget {
  const _NotificationSection({
    required this.title,
    required this.items,
  });

  final String title;
  final List<AppNotification> items;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              Text(
                '${items.length}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 8),
          for (var index = 0; index < items.length; index++) ...[
            _NotificationItem(item: items[index]),
            if (index != items.length - 1) const Divider(height: 1),
          ],
        ],
      ),
    );
  }
}

class _NotificationItem extends StatefulWidget {
  const _NotificationItem({required this.item});

  final AppNotification item;

  @override
  State<_NotificationItem> createState() => _NotificationItemState();
}

class _NotificationItemState extends State<_NotificationItem> {
  late AppNotification _item = widget.item;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final navigator = Navigator.of(context);

    return AppListItem(
      title: _item.title,
      subtitle: notificationPreviewMessage(_item),
      icon: _iconFor(_item.type),
      badge: _item.status == 'read' ? _formatTimestamp(_item.createdAt) : 'Unread',
      badgeTone: _item.status == 'read' ? AppBadgeTone.neutral : AppBadgeTone.primary,
      onTap: () async {
        var current = _item;
        if (_item.status != 'read') {
          current = await services.notificationApi.markAsRead(_item.notificationId);
          if (!mounted) {
            return;
          }
          setState(() {
            _item = current;
          });
        }
        if (!mounted) {
          return;
        }
        await openNotificationFromInbox(navigator, current);
      },
    );
  }
}

IconData _iconFor(String type) {
  switch (type) {
    case 'loan_due':
    case 'loan_overdue':
    case 'loan_approved':
    case 'loan_rejected':
    case 'loan_document_required':
    case 'loan_disbursed':
      return Icons.account_balance_wallet_outlined;
    case 'insurance_renewal_due':
    case 'insurance_expiring':
    case 'insurance_expired':
    case 'loan_linked_insurance_reminder':
      return Icons.shield_outlined;
    case 'payment_success':
    case 'payment_failed':
      return Icons.payments_outlined;
    case 'school_payment_due':
      return Icons.school_outlined;
    case 'autopay_success':
    case 'autopay_failed':
      return Icons.autorenew_rounded;
    case 'support_reply':
    case 'support_assigned':
    case 'support_resolved':
      return Icons.chat_bubble_outline_rounded;
    case 'suspicious_login':
    case 'account_locked':
    case 'account_unlocked':
    case 'phone_number_change_requested':
    case 'phone_number_change_completed':
      return Icons.security_outlined;
    case 'kyc_submitted':
    case 'kyc_verified':
    case 'kyc_rejected':
    case 'kyc_need_more_information':
      return Icons.verified_user_outlined;
    case 'shareholder_announcement':
    case 'shareholder_vote':
    case 'vote_open':
    case 'vote_closing_soon':
    case 'vote_result_published':
      return Icons.how_to_vote_outlined;
    case 'service_request':
      return Icons.assignment_outlined;
    case 'chat':
      return Icons.chat_bubble_outline_rounded;
    case 'payment':
      return Icons.payments_outlined;
    case 'loan_status':
      return Icons.account_balance_wallet_outlined;
    default:
      return Icons.notifications_none_rounded;
  }
}

String _formatTimestamp(DateTime value) {
  final hour = value.hour == 0 ? 12 : (value.hour > 12 ? value.hour - 12 : value.hour);
  final minute = value.minute.toString().padLeft(2, '0');
  final period = value.hour >= 12 ? 'PM' : 'AM';
  return '${value.month}/${value.day} $hour:$minute $period';
}
