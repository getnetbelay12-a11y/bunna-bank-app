import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/section_card.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<List<AppNotification>>(
      future: services.notificationApi.fetchMyNotifications(),
      builder: (context, snapshot) {
        final notifications = snapshot.data ?? const [];
        final now = DateTime.now();
        final today = notifications
            .where((item) => DateUtils.isSameDay(item.createdAt, now))
            .toList();
        final earlier = notifications
            .where((item) => !DateUtils.isSameDay(item.createdAt, now))
            .toList();

        Widget buildSection(String title, List<AppNotification> items) {
          if (items.isEmpty) {
            return const SizedBox.shrink();
          }

          return SectionCard(
            title: title,
            child: Column(
              children: [
                for (final item in items)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: item.status == 'read'
                          ? Colors.white
                          : const Color(0xFFE8F1FF),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: item.status == 'read'
                            ? const Color(0xFFD8E3F5)
                            : const Color(0xFF0F4CBA),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 6),
                              Text(item.message),
                              const SizedBox(height: 6),
                              Text(
                                '${item.type.replaceAll('_', ' ').toUpperCase()} • ${_formatTimestamp(item.createdAt)}',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(color: const Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: item.status == 'read'
                                ? const Color(0xFFF2F5FA)
                                : const Color(0xFF0F4CBA),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            item.status == 'read' ? 'Read' : 'Unread',
                            style: TextStyle(
                              color: item.status == 'read'
                                  ? Colors.black87
                                  : Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            leading: BackButton(
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: const Text('Notifications'),
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF0F172A),
            elevation: 0,
            scrolledUnderElevation: 0.5,
            surfaceTintColor: Colors.white,
          ),
          body: Material(
            color: const Color(0xFFF5F7FB),
            child: SafeArea(
              top: false,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Loan, insurance, KYC, savings, support, and system updates are grouped here.',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: const Color(0xFF64748B),
                          ),
                    ),
                    const SizedBox(height: 20),
                    buildSection('Today', today),
                    if (today.isNotEmpty && earlier.isNotEmpty)
                      const SizedBox(height: 16),
                    buildSection('Earlier', earlier),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

String _formatTimestamp(DateTime value) {
  const months = <String>[
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  final month = months[value.month - 1];
  final hour = value.hour == 0 ? 12 : (value.hour > 12 ? value.hour - 12 : value.hour);
  final minute = value.minute.toString().padLeft(2, '0');
  final period = value.hour >= 12 ? 'PM' : 'AM';
  return '$month ${value.day} • $hour:$minute $period';
}
