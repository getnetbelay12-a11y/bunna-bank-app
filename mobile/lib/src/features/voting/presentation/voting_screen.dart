import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_new_badge.dart';
import 'vote_detail_screen.dart';

class VotingScreen extends StatelessWidget {
  const VotingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final session = AppScope.of(context).session;
    final canAccess = session?.isShareholder == true && session?.canVote == true;

    return AppScaffold(
      title: 'Shareholder Voting',
      showBack: true,
      body: FutureBuilder<List<VoteSummary>>(
          future: canAccess
              ? services.votingApi.fetchActiveVotes()
              : Future.value(const <VoteSummary>[]),
          builder: (context, snapshot) {
            if (!canAccess) {
              return const _VotingStateCard(
                title: 'Voting unavailable',
                message:
                    'This feature is only visible to shareholder members during active voting events.',
              );
            }

            if (snapshot.hasError) {
              return const _VotingStateCard(
                title: 'Voting unavailable',
                message: 'Unable to load the current voting event.',
              );
            }

            final votes = snapshot.data ?? const <VoteSummary>[];
            if (votes.isEmpty) {
              return const _VotingStateCard(
                title: 'No Active Voting',
                message:
                    'There is no active shareholder voting event at the moment.',
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: votes.length,
              separatorBuilder: (_, __) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final vote = votes[index];
                return AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AppHeader(
                        title: vote.title,
                        subtitle: vote.description,
                        trailing: const AppNewBadge(),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          const _MetaChip(
                            label: 'Type',
                            value: 'Shareholder vote',
                          ),
                          _MetaChip(
                            label: 'Status',
                            value: vote.status.toUpperCase(),
                          ),
                          _MetaChip(
                            label: 'Countdown',
                            value: _countdownLabel(vote.endDate),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      AppButton(
                        label: 'Vote Now',
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => VoteDetailScreen(voteId: vote.voteId),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
    );
  }
}

class _VotingStateCard extends StatelessWidget {
  const _VotingStateCard({
    required this.title,
    required this.message,
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: abayBorder),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.how_to_vote_outlined,
                size: 42,
                color: abayPrimary,
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                message,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: abayTextSoft,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: abayPrimarySoft,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: abayTextSoft,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: abayPrimary,
                  fontWeight: FontWeight.w800,
                ),
          ),
        ],
      ),
    );
  }
}

String _countdownLabel(DateTime endDate) {
  final difference = endDate.difference(DateTime.now());
  if (difference.isNegative) {
    return 'Closed';
  }

  return '${difference.inDays}d ${difference.inHours.remainder(24)}h left';
}
