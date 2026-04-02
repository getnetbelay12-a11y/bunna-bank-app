import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';
import '../../../app/app_scope.dart';
import '../../../shared/widgets/feature_placeholder.dart';
import '../../../shared/widgets/section_card.dart';

class VotingScreen extends StatefulWidget {
  const VotingScreen({super.key});

  @override
  State<VotingScreen> createState() => _VotingScreenState();
}

class _VotingScreenState extends State<VotingScreen> {
  String? _message;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Governance Voting'),
      ),
      body: SafeArea(
        child: FutureBuilder(
          future: services.votingApi.fetchActiveVotes(),
          builder: (context, snapshot) {
            final votes = snapshot.data ?? const [];

            return SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const FeaturePlaceholder(
                    title: 'Annual Voting',
                    description:
                        'Active votes and live governance participation for shareholder members.',
                  ),
                  if (_message != null) ...[
                    const SizedBox(height: 8),
                    Text(_message!),
                  ],
                  const SizedBox(height: 16),
                  for (final vote in votes)
                    SectionCard(
                      title: vote.title,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(vote.description),
                          const SizedBox(height: 8),
                          Text(
                            'Deadline: ${vote.endDate.toLocal()}',
                            style:
                                Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: const Color(0xFF64748B),
                                    ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            width: 48,
                            height: 4,
                            decoration: BoxDecoration(
                              color: cbeLightBlue,
                              borderRadius: BorderRadius.circular(999),
                            ),
                          ),
                          const SizedBox(height: 12),
                          FilledButton(
                            onPressed: () async {
                              final result = await services.votingApi.submitVote(
                                vote.voteId,
                                optionId: 'option_demo_1',
                                encryptedBallot: 'encrypted-demo-ballot',
                                otpCode: '123456',
                              );

                              setState(() {
                                _message =
                                    'Vote recorded for ${result['voteId']}.';
                              });
                            },
                            style: FilledButton.styleFrom(
                              backgroundColor: cbeBlue,
                            ),
                            child: const Text('Vote'),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
