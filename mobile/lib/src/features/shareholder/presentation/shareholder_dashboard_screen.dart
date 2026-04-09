import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_list_item.dart';
import '../../../shared/widgets/app_new_badge.dart';
import '../../announcements/presentation/shareholder_announcement_detail_screen.dart';
import '../../announcements/presentation/shareholder_announcements_screen.dart';
import '../../voting/presentation/vote_detail_screen.dart';

class ShareholderDashboardScreen extends StatelessWidget {
  const ShareholderDashboardScreen({
    super.key,
    required this.session,
  });

  final MemberSession session;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    if (!session.isShareholder) {
      return const AppScaffold(
        title: 'Shareholder Dashboard',
        showBack: true,
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'Shareholder services are only available for eligible members.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    return FutureBuilder<List<dynamic>>(
      future: Future.wait<dynamic>([
        services.shareholderApi.fetchMyShareholderProfile(),
        session.featureFlags.voting
            ? services.votingApi.fetchActiveVotes()
            : Future.value(const <VoteSummary>[]),
        services.notificationApi.fetchMyNotifications(),
      ]),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return const AppScaffold(
            title: 'Shareholder Dashboard',
            showBack: true,
            body: Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Shareholder information is temporarily unavailable.',
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          );
        }

        final shareholder = snapshot.data?[0] as ShareholderProfile?;
        final votes =
            snapshot.data?[1] as List<VoteSummary>? ?? const <VoteSummary>[];
        final notifications =
            snapshot.data?[2] as List<AppNotification>? ??
                const <AppNotification>[];
        final announcements = notifications
            .where(
              (item) =>
                  item.type == 'announcement' ||
                  item.type == 'campaign' ||
                  item.type == 'shareholder_vote',
            )
            .take(3)
            .toList();
        final activity = notifications
            .where(
              (item) =>
                  item.type == 'shareholder_vote' ||
                  item.type == 'announcement' ||
                  item.type == 'campaign',
            )
            .take(3)
            .toList();
        final activeVote = votes.isNotEmpty ? votes.first : null;

        return AppScaffold(
          title: 'Shareholder Dashboard',
          showBack: true,
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
                Text(
                  'Track your shareholder profile, active voting, and governance activity.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: abayTextSoft,
                      ),
                ),
                const SizedBox(height: 16),
                AppCard(
                  child: shareholder == null
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.symmetric(vertical: 24),
                            child: CircularProgressIndicator(),
                          ),
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Shareholder Summary',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(fontWeight: FontWeight.w800),
                                  ),
                                ),
                                AppBadge(
                                  label: shareholder.status.toUpperCase(),
                                  tone: shareholder.status == 'active'
                                      ? AppBadgeTone.success
                                      : AppBadgeTone.warning,
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _SummaryRow(
                              label: 'Shareholder ID',
                              value: shareholder.shareholderId,
                            ),
                            const Divider(height: 24),
                            _SummaryRow(
                              label: 'Total Shares',
                              value:
                                  shareholder.totalShares.toStringAsFixed(0),
                            ),
                            const Divider(height: 24),
                            _SummaryRow(
                              label: 'Member Since',
                              value: shareholder.memberSince != null
                                  ? _formatDate(shareholder.memberSince!)
                                  : 'Not available',
                            ),
                            const Divider(height: 24),
                            _SummaryRow(
                              label: 'Member Name',
                              value: shareholder.fullName,
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
                          Text(
                            'Voting',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(width: 8),
                          const AppNewBadge(),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (activeVote == null) ...[
                        const Text(
                          'No Active Voting',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Voting will appear here when a shareholder event is open.',
                          style: TextStyle(color: abayTextSoft),
                        ),
                      ] else ...[
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                activeVote.title,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w700),
                              ),
                            ),
                            const AppBadge(
                              label: 'OPEN',
                              tone: AppBadgeTone.primary,
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            AppBadge(
                              label: _countdownLabel(
                                activeVote.startDate,
                                activeVote.endDate,
                              ),
                              tone: AppBadgeTone.primary,
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        AppButton(
                          label: 'Vote Now',
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) =>
                                    VoteDetailScreen(voteId: activeVote.voteId),
                              ),
                            );
                          },
                        ),
                      ],
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
                              'Announcements',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                          if (announcements.isNotEmpty)
                            TextButton(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) =>
                                        const ShareholderAnnouncementsScreen(),
                                  ),
                                );
                              },
                              child: const Text('View all'),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (announcements.isEmpty)
                        const Text(
                          'No recent shareholder announcements are available.',
                          style: TextStyle(color: abayTextSoft),
                        )
                      else
                        for (var index = 0; index < announcements.length; index++) ...[
                          AppListItem(
                            title: announcements[index].title,
                            subtitle: announcements[index].message,
                            icon: Icons.campaign_outlined,
                            badge: _formatDate(announcements[index].createdAt),
                            badgeTone: AppBadgeTone.neutral,
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) =>
                                      ShareholderAnnouncementDetailScreen(
                                    notification: announcements[index],
                                  ),
                                ),
                              );
                            },
                          ),
                          if (index != announcements.length - 1)
                            const Divider(height: 1),
                        ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Activity',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      if (activity.isEmpty)
                        const Text(
                          'Recent shareholder actions will appear here.',
                          style: TextStyle(color: abayTextSoft),
                        )
                      else
                        for (var index = 0; index < activity.length; index++) ...[
                          AppListItem(
                            title: activity[index].title,
                            subtitle:
                                '${activity[index].type.replaceAll('_', ' ')} • ${_formatDate(activity[index].createdAt)}',
                            icon: Icons.history_rounded,
                            onTap: () {},
                          ),
                          if (index != activity.length - 1)
                            const Divider(height: 1),
                        ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Future Features',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'These services stay secondary until the core shareholder workflow is fully active.',
                        style: TextStyle(color: abayTextSoft),
                      ),
                      SizedBox(height: 12),
                      _FutureFeatureRow(
                        title: 'Dividend Tracking',
                        subtitle:
                            'Future dividend statements and payout notices will appear here.',
                      ),
                      SizedBox(height: 12),
                      _FutureFeatureRow(
                        title: 'Share Performance',
                        subtitle:
                            'Future share performance and governance analytics will appear here.',
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: abayTextSoft,
                ),
          ),
        ),
        const SizedBox(width: 16),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
        ),
      ],
    );
  }
}

class _FutureFeatureRow extends StatelessWidget {
  const _FutureFeatureRow({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: abaySurfaceElevated,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: abayTextSoft,
                ),
          ),
        ],
      ),
    );
  }
}

String _formatDate(DateTime value) {
  final month = value.month.toString().padLeft(2, '0');
  final day = value.day.toString().padLeft(2, '0');
  return '${value.year}-$month-$day';
}

String _countdownLabel(DateTime? opensAt, DateTime? closesAt) {
  final now = DateTime.now();
  if (closesAt != null && closesAt.isAfter(now)) {
    final difference = closesAt.difference(now);
    return '${difference.inDays}d ${difference.inHours.remainder(24)}h left';
  }
  if (opensAt != null && opensAt.isAfter(now)) {
    final difference = opensAt.difference(now);
    return 'Opens in ${difference.inDays}d';
  }
  return 'Open now';
}
