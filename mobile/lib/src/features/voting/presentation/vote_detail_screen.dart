import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import 'vote_confirmation_screen.dart';

class VoteDetailScreen extends StatefulWidget {
  const VoteDetailScreen({
    super.key,
    required this.voteId,
  });

  final String voteId;

  @override
  State<VoteDetailScreen> createState() => _VoteDetailScreenState();
}

class _VoteDetailScreenState extends State<VoteDetailScreen> {
  String? _selectedOptionId;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Vote Detail'),
      ),
      body: SafeArea(
        child: FutureBuilder<VoteDetail>(
          future: services.votingApi.fetchVoteDetail(widget.voteId),
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('Unable to load this voting event.'),
                ),
              );
            }

            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }

            final vote = snapshot.data!;
            return ListView(
              padding: const EdgeInsets.all(20),
              children: [
                AppHeader(
                  title: vote.title,
                  subtitle: vote.description,
                ),
                const SizedBox(height: 20),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Select one option',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 10),
                      for (final option in vote.options)
                        _VoteOptionTile(
                          option: option,
                          selected: _selectedOptionId == option.optionId,
                          onTap: () {
                            setState(() {
                              _selectedOptionId = option.optionId;
                            });
                          },
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                AppButton(
                  label: 'Submit',
                  onPressed: _selectedOptionId == null
                      ? null
                      : () {
                          final selectedOption = vote.options.firstWhere(
                            (item) => item.optionId == _selectedOptionId,
                          );
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => VoteConfirmationScreen(
                                vote: vote,
                                selectedOption: selectedOption,
                              ),
                            ),
                          );
                        },
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _VoteOptionTile extends StatelessWidget {
  const _VoteOptionTile({
    required this.option,
    required this.selected,
    required this.onTap,
  });

  final VoteOption option;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? abayPrimarySoft : const Color(0xFFF8FAFD),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? abayPrimary : abayBorder,
            width: selected ? 1.4 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              selected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_off_rounded,
              color: selected ? abayPrimary : abayTextSoft,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.name,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  if (option.description?.isNotEmpty == true) ...[
                    const SizedBox(height: 6),
                    Text(
                      option.description!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: abayTextSoft,
                          ),
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
