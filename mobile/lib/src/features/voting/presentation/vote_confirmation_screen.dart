import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import 'vote_success_screen.dart';

class VoteConfirmationScreen extends StatefulWidget {
  const VoteConfirmationScreen({
    super.key,
    required this.vote,
    required this.selectedOption,
  });

  final VoteDetail vote;
  final VoteOption selectedOption;

  @override
  State<VoteConfirmationScreen> createState() => _VoteConfirmationScreenState();
}

class _VoteConfirmationScreenState extends State<VoteConfirmationScreen> {
  bool _submitting = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final navigator = Navigator.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Confirm Vote'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.vote.title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Selected option',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: abayTextSoft,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    widget.selectedOption.name,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  if (widget.selectedOption.description?.isNotEmpty == true) ...[
                    const SizedBox(height: 10),
                    Text(widget.selectedOption.description!),
                  ],
                ],
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(
                _error!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.red.shade700,
                    ),
              ),
            ],
            const SizedBox(height: 20),
            AppButton(
              label: _submitting ? 'Submitting...' : 'Confirm',
              onPressed: _submitting
                  ? null
                  : () async {
                      setState(() {
                        _submitting = true;
                        _error = null;
                      });

                      try {
                        await services.votingApi.submitVote(
                          widget.vote.voteId,
                          optionId: widget.selectedOption.optionId,
                          encryptedBallot:
                              'vote:${widget.vote.voteId}:${widget.selectedOption.optionId}',
                          otpCode: '123456',
                        );

                        if (!mounted) {
                          return;
                        }

                        navigator.pushReplacement(
                          MaterialPageRoute<void>(
                            builder: (_) => const VoteSuccessScreen(),
                          ),
                        );
                      } catch (error) {
                        if (!mounted) {
                          return;
                        }

                        setState(() {
                          _error = _friendlyError(error);
                        });
                      } finally {
                        if (mounted) {
                          setState(() {
                            _submitting = false;
                          });
                        }
                      }
                    },
            ),
          ],
        ),
      ),
    );
  }
}

String _friendlyError(Object error) {
  final text = error.toString();
  if (text.startsWith('Exception: ')) {
    return text.substring('Exception: '.length);
  }

  return text.isEmpty ? 'Unable to submit your vote.' : text;
}
