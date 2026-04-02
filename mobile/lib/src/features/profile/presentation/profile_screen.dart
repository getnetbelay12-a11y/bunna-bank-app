import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';
import '../../../../widgets/cbe_bank_logo.dart';
import '../../../app/app_controller.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../chat/presentation/live_chat_list_screen.dart';
import '../../help_support/presentation/help_support_screen.dart';
import '../../membership/presentation/fayda_verification_screen.dart';
import '../../notifications/presentation/notifications_screen.dart';
import '../../phone_number_update/presentation/phone_number_update_screen.dart';
import '../../settings/presentation/settings_screen.dart';
import '../../voting/presentation/voting_screen.dart';
import 'beneficiary_management_screen.dart';
import 'terms_conditions_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({
    super.key,
    required this.session,
  });

  final MemberSession session;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final controller = AppScope.of(context);
    final isAmharic = controller.language == AppLanguage.amharic;

    return FutureBuilder<List<VoteSummary>>(
      future: session.featureFlags.voting
          ? services.votingApi.fetchActiveVotes()
          : Future.value(const <VoteSummary>[]),
      builder: (context, snapshot) {
        final hasActiveVotingEvent =
            (snapshot.data ?? const <VoteSummary>[]).isNotEmpty;
        final items = [
          _MoreAction(
            title: 'Language',
            subtitle: isAmharic
                ? 'Switch to English or keep Amharic for the app interface.'
                : 'Switch to Amharic or keep English for the app interface.',
            onTap: controller.toggleLanguage,
          ),
          _MoreAction(
            title: 'KYC Verification',
            subtitle: 'Review and submit your identity verification details.',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const FaydaVerificationScreen(),
                ),
              );
            },
          ),
          if (session.featureFlags.voting && hasActiveVotingEvent)
            _MoreAction(
              title: 'Governance Voting',
              subtitle:
                  'Join the active shareholder voting event while it is open.',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const VotingScreen(),
                  ),
                );
              },
            ),
          _MoreAction(
            title: 'Security Settings',
            subtitle: 'PIN, notification, and app preference controls.',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const SettingsScreen(),
                ),
              );
            },
          ),
          _MoreAction(
            title: 'Beneficiary Management',
            subtitle:
                'Manage saved recipients and trusted payment destinations.',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const BeneficiaryManagementScreen(),
                ),
              );
            },
          ),
          _MoreAction(
            title: 'Notifications',
            subtitle: 'View loan, insurance, support, and system alerts.',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const NotificationsScreen(),
                ),
              );
            },
          ),
          _MoreAction(
            title: 'Support',
            subtitle: 'FAQ, support channels, and live service help.',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const HelpSupportScreen(),
                ),
              );
            },
          ),
          _MoreAction(
            title: 'Terms',
            subtitle:
                'Review service terms, disclosures, and privacy guidance.',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const TermsConditionsScreen(),
                ),
              );
            },
          ),
          _MoreAction(
            title: 'Update Phone Number',
            subtitle:
                'Change your phone number with identity verification and OTP review.',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const PhoneNumberUpdateScreen(),
                ),
              );
            },
          ),
          if (session.featureFlags.liveChat)
            _MoreAction(
              title: 'Live Chat',
              subtitle:
                  'Chat with smart support first, then hand off to an agent.',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const LiveChatListScreen(),
                  ),
                );
              },
            ),
          _MoreAction(
            title: 'Logout',
            subtitle: 'Securely sign out from this device.',
            onTap: controller.logout,
          ),
        ];

        return Material(
          color: const Color(0xFFF5F7FB),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: cbeBlue.withValues(alpha: 0.10),
                  ),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x14000000),
                      blurRadius: 10,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const CbeBankLogo(width: 72),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Profile',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: cbeBlue,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE8F1FF),
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(
                                color: cbeBlue.withValues(alpha: 0.18),
                              ),
                            ),
                            child: Text(
                              'Updated Navigation',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    color: cbeBlue,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            session.fullName,
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Manage language, security, support, beneficiaries, KYC, and account controls from one place.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: const Color(0xFF5C5C5C),
                    ),
              ),
              if (session.featureFlags.voting && !hasActiveVotingEvent) ...[
                const SizedBox(height: 20),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF6F9FF),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFD4E2FF)),
                  ),
                  child: Text(
                    'Governance voting will appear here only when there is an active event.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: cbeBlue,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              ],
              const SizedBox(height: 20),
              for (final item in items)
                Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text(item.title),
                    subtitle: Text(item.subtitle),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: item.onTap,
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

class _MoreAction {
  const _MoreAction({
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final VoidCallback onTap;
}
