import 'package:flutter/material.dart';

import '../../../../widgets/bunna_bank_logo_compat.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/status_cards.dart';

class OnboardingStatusScreen extends StatelessWidget {
  const OnboardingStatusScreen({
    super.key,
    required this.customerId,
    required this.phoneNumber,
    required this.reviewStatus,
    required this.statusMessage,
    this.selectedBranchName,
  });

  final String customerId;
  final String phoneNumber;
  final String reviewStatus;
  final String statusMessage;
  final String? selectedBranchName;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<OnboardingStatus>(
      future: services.authApi.getOnboardingStatus(
        customerId: customerId,
        phoneNumber: phoneNumber,
      ),
      builder: (context, snapshot) {
        final data = snapshot.data ??
            OnboardingStatus(
              customerId: customerId,
              phoneNumber: phoneNumber,
              onboardingReviewStatus: reviewStatus,
              membershipStatus: 'pending_verification',
              identityVerificationStatus: 'submitted',
              requiredAction:
                  'Your onboarding package is waiting for branch and KYC review.',
              statusMessage: statusMessage,
              branchName: selectedBranchName,
            );

        return _OnboardingStatusView(data: data);
      },
    );
  }
}

class _OnboardingStatusView extends StatelessWidget {
  const _OnboardingStatusView({required this.data});

  final OnboardingStatus data;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Onboarding Status'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Center(child: BunnaBankLogo(width: 96)),
              const SizedBox(height: 20),
              Text(
                'Account opening submitted',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'This status now reads from the bank onboarding workflow so the customer sees the real review state, not only a local submit message.',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 20),
              DetailLinesCard(
                tone: _toneForStatus(data.onboardingReviewStatus),
                items: [
                  DetailLineItem(label: 'Customer ID', value: data.customerId),
                  DetailLineItem(
                    label: 'Review status',
                    value: data.onboardingReviewStatus
                        .replaceAll('_', ' ')
                        .toUpperCase(),
                  ),
                  DetailLineItem(label: 'Phone', value: data.phoneNumber),
                  if (data.branchName != null)
                    DetailLineItem(
                      label: 'Preferred branch',
                      value: data.branchName!,
                    ),
                  DetailLineItem(
                    label: 'Identity state',
                    value:
                        '${data.identityVerificationStatus} / ${data.membershipStatus}',
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const ChecklistCard(
                title: 'What is done',
                points: [
                  'Phone and OTP verification completed.',
                  'Fayda document package submitted.',
                  'Selfie checkpoint captured for higher-risk review.',
                  'Initial PIN setup completed.',
                ],
              ),
              const SizedBox(height: 16),
              ChecklistCard(
                title: 'What happens next',
                tone: _toneForStatus(data.onboardingReviewStatus),
                points: [
                  data.requiredAction,
                  data.statusMessage,
                  if (data.reviewNote != null && data.reviewNote!.isNotEmpty)
                    data.reviewNote!,
                ],
              ),
              if (data.lastUpdatedAt != null) ...[
                const SizedBox(height: 16),
                Text(
                  'Last updated: ${_formatDateTime(data.lastUpdatedAt!)}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF475569),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  child: const Text('Return to Login'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

StatusCardTone _toneForStatus(String status) {
  switch (status) {
    case 'approved':
      return StatusCardTone.success;
    case 'needs_action':
      return StatusCardTone.warning;
    case 'review_in_progress':
      return StatusCardTone.info;
    case 'rejected':
      return StatusCardTone.danger;
    case 'submitted':
    default:
      return StatusCardTone.info;
  }
}

String _formatDateTime(DateTime value) {
  final month = value.month.toString().padLeft(2, '0');
  final day = value.day.toString().padLeft(2, '0');
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '${value.year}-$month-$day $hour:$minute';
}
