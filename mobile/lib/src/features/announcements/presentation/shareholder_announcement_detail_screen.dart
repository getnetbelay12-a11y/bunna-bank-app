import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../notifications/presentation/notification_display.dart';

class ShareholderAnnouncementDetailScreen extends StatelessWidget {
  const ShareholderAnnouncementDetailScreen({
    super.key,
    required this.notification,
  });

  final AppNotification notification;

  @override
  Widget build(BuildContext context) {
    final detailRows = <_DetailRow>[
      const _DetailRow(label: 'Category', value: 'Shareholder governance'),
      _DetailRow(
        label: 'Status',
        value: notification.status.toUpperCase(),
      ),
      _DetailRow(
        label: 'Received',
        value: _formatDateTime(notification.createdAt),
      ),
      _DetailRow(
        label: 'Action',
        value: notification.actionLabel ?? 'Open shareholder workspace',
      ),
      const _DetailRow(label: 'Event', value: 'Annual Shareholder Vote'),
      const _DetailRow(
        label: 'Audience',
        value: 'Eligible shareholder members',
      ),
      const _DetailRow(
        label: 'Current state',
        value: 'Open for review and participation',
      ),
    ];

    final summary = notificationPreviewMessage(notification);

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Shareholder Update'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: abayPrimarySoft,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text(
                      'SHAREHOLDER GOVERNANCE',
                      style: TextStyle(
                        color: abayPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    notification.title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    summary,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: abayTextSoft,
                          height: 1.45,
                        ),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: abaySurfaceAlt,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: abayBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Full update',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          isShareholderNotification(notification)
                              ? 'A shareholder voting event or governance update is available in your Bunna Bank app. Review the agenda, event status, audience scope, and participation path before the closing date.'
                              : notification.message,
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Detail summary',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 16),
                  for (var index = 0; index < detailRows.length; index++) ...[
                    _InfoTile(row: detailRows[index]),
                    if (index != detailRows.length - 1) const Divider(height: 20),
                  ],
                  if ((notification.deepLink ?? '').isNotEmpty) ...[
                    const SizedBox(height: 18),
                    AppButton(
                      label: 'Back to notifications',
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow {
  const _DetailRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.row});

  final _DetailRow row;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 4,
          child: Text(
            row.label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: abayTextSoft,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 6,
          child: Text(
            row.value,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
        ),
      ],
    );
  }
}

String _formatDateTime(DateTime value) {
  final month = value.month.toString().padLeft(2, '0');
  final day = value.day.toString().padLeft(2, '0');
  final hour = value.hour == 0 ? 12 : (value.hour > 12 ? value.hour - 12 : value.hour);
  final minute = value.minute.toString().padLeft(2, '0');
  final period = value.hour >= 12 ? 'PM' : 'AM';
  return '${value.year}-$month-$day $hour:$minute $period';
}
