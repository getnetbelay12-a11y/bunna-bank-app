import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/section_card.dart';
import '../../../shared/widgets/status_cards.dart';
import 'fayda_verification_screen.dart';

class MembershipScreen extends StatelessWidget {
  const MembershipScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final session = controller.session;

    if (session == null) {
      return const SizedBox.shrink();
    }

    return FutureBuilder<MemberProfile>(
      future: controller.services.memberApi.fetchMyProfile(session.memberId),
      builder: (context, snapshot) {
        final profile = snapshot.data;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (profile != null) ...[
                SectionCard(
                  title: 'Onboarding Review',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      StatusBannerCard(
                        title:
                            'Review Status: ${_formatStatus(profile.onboardingReviewStatus)}',
                        message:
                            'Next Step: ${_reviewGuidance(profile.onboardingReviewStatus)}',
                        tone: _toneForReviewStatus(profile.onboardingReviewStatus),
                      ),
                      if (profile.onboardingReviewNote != null &&
                          profile.onboardingReviewNote!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        StatusBannerCard(
                          title: 'Review Note',
                          message: profile.onboardingReviewNote!,
                          tone:
                              _toneForReviewStatus(profile.onboardingReviewStatus),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              SectionCard(
                title: 'Membership Profile',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Name: ${profile?.fullName ?? session.fullName}'),
                    const SizedBox(height: 8),
                    Text('Customer ID: ${profile?.customerId ?? session.customerId}'),
                    const SizedBox(height: 8),
                    Text('Phone: ${profile?.phone ?? session.phone}'),
                    const SizedBox(height: 8),
                    Text('Branch: ${profile?.branchName ?? session.branchName}'),
                    const SizedBox(height: 8),
                    Text(
                      'Membership Status: ${profile?.membershipStatus ?? session.membershipStatus}',
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Identity Status: ${profile?.identityVerificationStatus ?? session.identityVerificationStatus}',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SectionCard(
                title: 'Fayda Verification',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Submit FIN, QR data, or a credential upload reference. Manual review status is clearly distinguished from official validation.',
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const FaydaVerificationScreen(),
                          ),
                        );
                      },
                      child: const Text('Open Fayda Verification'),
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

String _formatStatus(String value) => value.replaceAll('_', ' ').toUpperCase();

String _reviewGuidance(String status) {
  switch (status) {
    case 'approved':
      return 'Your onboarding review is complete and verified-member access should remain available.';
    case 'needs_action':
      return 'Update the requested onboarding evidence before secure service access can expand.';
    case 'review_in_progress':
      return 'Branch and KYC teams are still reviewing your onboarding package.';
    case 'submitted':
    default:
      return 'Your onboarding package has been submitted and is waiting for review.';
  }
}

StatusCardTone _toneForReviewStatus(String status) {
  switch (status) {
    case 'approved':
      return StatusCardTone.success;
    case 'needs_action':
      return StatusCardTone.warning;
    case 'review_in_progress':
      return StatusCardTone.info;
    default:
      return StatusCardTone.info;
  }
}
