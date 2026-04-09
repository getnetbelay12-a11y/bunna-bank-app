import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import 'shareholder_announcement_detail_screen.dart';

class ShareholderAnnouncementsScreen extends StatelessWidget {
  const ShareholderAnnouncementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<List<AppNotification>>(
      future: services.notificationApi.fetchMyNotifications(),
      builder: (context, snapshot) {
        final announcements = (snapshot.data ?? const <AppNotification>[])
            .where(
              (item) =>
                  item.type == 'announcement' ||
                  item.type == 'shareholder_vote' ||
                  item.type == 'campaign',
            )
            .toList();

        return Scaffold(
          appBar: AppBar(
            leading: const BackButton(),
            title: const Text('Shareholder Announcements'),
          ),
          body: SafeArea(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5FF),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFB9DBFF)),
                  ),
                  child: const Text(
                    'Recent governance announcements, AGM notices, and shareholder campaign messages appear here for eligible members.',
                  ),
                ),
                const SizedBox(height: 16),
                if (announcements.isEmpty)
                  const Card(
                    child: ListTile(
                      title: Text('No recent shareholder announcements'),
                      subtitle: Text(
                        'Announcements will appear here when governance communications are published.',
                      ),
                    ),
                  ),
                for (final item in announcements)
                  Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: const Icon(
                        Icons.campaign_rounded,
                        color: abayPrimary,
                      ),
                      title: Text(item.title),
                      subtitle: Text(item.message),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) =>
                                ShareholderAnnouncementDetailScreen(
                              notification: item,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
