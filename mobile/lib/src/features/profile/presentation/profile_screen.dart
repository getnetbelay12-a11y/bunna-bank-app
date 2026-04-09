import 'package:flutter/material.dart';

import '../../../app/app_controller.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_list_item.dart';
import '../../../shared/widgets/app_new_badge.dart';
import '../../account_relationships/presentation/account_relationships_screen.dart';
import '../../atm_orders/presentation/atm_order_screen.dart';
import '../../cards/presentation/card_management_screen.dart';
import '../../chat/presentation/live_chat_list_screen.dart';
import '../../help_support/presentation/help_support_screen.dart';
import '../../membership/presentation/fayda_verification_screen.dart';
import '../../notifications/presentation/notifications_screen.dart';
import '../../phone_number_update/presentation/phone_number_update_screen.dart';
import '../../settings/presentation/settings_screen.dart';
import '../../shareholder/presentation/shareholder_dashboard_screen.dart';
import 'banking_services_screen.dart';
import 'beneficiary_management_screen.dart';
import 'document_vault_screen.dart';
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

    return FutureBuilder<List<dynamic>>(
      future: Future.wait<dynamic>([
        session.isShareholder && session.featureFlags.voting
            ? services.votingApi.fetchActiveVotes()
            : Future.value(const <VoteSummary>[]),
        services.memberApi.fetchMyProfile(session.memberId),
      ]),
      builder: (context, snapshot) {
        final votes = snapshot.data?[0] as List<VoteSummary>? ?? const <VoteSummary>[];
        final profile = snapshot.data?[1] as MemberProfile?;

        final accountItems = <_ActionItem>[
          _ActionItem(
            title: 'My Profile',
            subtitle: 'Review your branch, membership, and onboarding status.',
            icon: Icons.person_outline_rounded,
            onTap: () => _showProfileSummary(context, session, profile),
          ),
          _ActionItem(
            title: 'KYC Verification',
            subtitle: 'Review status, Fayda details, and selfie verification.',
            icon: Icons.verified_user_outlined,
            onTap: () => _open(context, const FaydaVerificationScreen()),
          ),
          _ActionItem(
            title: 'Document Vault',
            subtitle: 'Statements, receipts, loan docs, and KYC files.',
            icon: Icons.folder_outlined,
            onTap: () => _open(context, const DocumentVaultScreen()),
          ),
          _ActionItem(
            title: 'Update Phone',
            subtitle: 'Change your mobile number securely.',
            icon: Icons.phone_iphone_outlined,
            onTap: () => _open(context, const PhoneNumberUpdateScreen()),
          ),
          _ActionItem(
            title: 'Linked Members',
            subtitle: 'Request nominee, joint holder, or family-member support.',
            icon: Icons.group_add_outlined,
            onTap: () => _open(context, const AccountRelationshipsScreen()),
          ),
          _ActionItem(
            title: 'Beneficiaries',
            subtitle: 'Manage saved recipients for faster transfers.',
            icon: Icons.people_outline_rounded,
            onTap: () => _open(context, const BeneficiaryManagementScreen()),
          ),
        ];

        final securityItems = <_ActionItem>[
          _ActionItem(
            title: 'Biometrics',
            subtitle: 'Manage biometric sign-in and secure device access.',
            icon: Icons.lock_outline_rounded,
            onTap: () => _open(context, const SettingsScreen()),
          ),
          _ActionItem(
            title: 'Account Lock',
            subtitle: 'Control high-risk actions and temporary account restrictions.',
            icon: Icons.lock_clock_outlined,
            onTap: () => _open(context, const SettingsScreen()),
          ),
          _ActionItem(
            title: 'Change Password / PIN',
            subtitle: 'Update secure sign-in credentials and recovery settings.',
            icon: Icons.password_outlined,
            onTap: () => _open(context, const SettingsScreen()),
          ),
          _ActionItem(
            title: 'Devices & Sessions',
            subtitle: 'Review trusted devices and active sessions.',
            icon: Icons.devices_outlined,
            onTap: () => _open(context, const SettingsScreen()),
          ),
        ];

        final supportAndSettingsItems = <_ActionItem>[
          _ActionItem(
            title: 'Live Chat',
            subtitle: 'Message support directly.',
            icon: Icons.chat_bubble_outline_rounded,
            onTap: () => _open(context, const LiveChatListScreen()),
          ),
          _ActionItem(
            title: 'ABa Care Center',
            subtitle: 'Care services, support guidance, and FAQ access.',
            icon: Icons.support_agent_outlined,
            onTap: () => _open(context, const HelpSupportScreen()),
          ),
          _ActionItem(
            title: 'Card Management',
            subtitle: 'Lock cards, request replacements, and review card status.',
            icon: Icons.credit_card_outlined,
            onTap: () => _open(context, const CardManagementScreen()),
          ),
          _ActionItem(
            title: 'ATM Order',
            subtitle: 'Prepare an ATM cash order before you travel.',
            icon: Icons.local_atm_outlined,
            onTap: () => _open(context, const AtmOrderScreen()),
          ),
          _ActionItem(
            title: 'Banking Tools',
            subtitle: 'Branch locator, exchange rate, loan calculator, fast track, and spending.',
            icon: Icons.grid_view_rounded,
            onTap: () => _open(context, const BankingServicesScreen()),
          ),
          _ActionItem(
            title: 'Terms',
            subtitle: 'Service terms and disclosures.',
            icon: Icons.description_outlined,
            onTap: () => _open(context, const TermsConditionsScreen()),
          ),
          _ActionItem(
            title: 'Language',
            subtitle: isAmharic ? 'Switch to English' : 'Switch to Amharic',
            icon: Icons.language_rounded,
            onTap: controller.toggleLanguage,
          ),
          _ActionItem(
            title: 'Notifications',
            subtitle: 'Loan, payment, support, and security alerts.',
            icon: Icons.notifications_none_rounded,
            onTap: () => _open(context, const NotificationsScreen()),
          ),
        ];

        final governanceItems = <_ActionItem>[
          if (session.isShareholder)
            _ActionItem(
              title: 'Shareholder Dashboard',
              subtitle: votes.isNotEmpty
                  ? 'Voting, announcements, and shareholder activity.'
                  : 'Shareholder summary and governance services.',
              icon: Icons.account_balance_outlined,
              onTap: () => _open(context, ShareholderDashboardScreen(session: session)),
            ),
        ];

        final logoutItems = <_ActionItem>[
          _ActionItem(
            title: 'Logout',
            subtitle: 'Securely sign out of this device.',
            icon: Icons.logout_rounded,
            onTap: controller.logout,
          ),
        ];

        return Material(
          color: Colors.white,
          child: SafeArea(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                AppHeader(
                  title: 'Profile',
                  subtitle: session.fullName,
                  trailing: Text(
                    session.customerId,
                    style: Theme.of(context).textTheme.bodySmall,
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
                              'Account summary',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                          AppBadge(
                            label: session.membershipStatus.replaceAll('_', ' ').toUpperCase(),
                            tone: AppBadgeTone.neutral,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Branch: ${session.branchName}'),
                      const SizedBox(height: 4),
                      Text('Customer ID: ${session.customerId}'),
                      const SizedBox(height: 4),
                      Text('KYC: ${session.identityVerificationStatus.replaceAll('_', ' ')}'),
                      if (profile?.onboardingReviewStatus != null) ...[
                        const SizedBox(height: 4),
                        Text('Onboarding: ${profile!.onboardingReviewStatus.replaceAll('_', ' ')}'),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _SectionCard(
                  title: 'Account',
                  caption: 'Identity, documents, linked members, and beneficiary setup.',
                  items: accountItems,
                ),
                const SizedBox(height: 16),
                _SectionCard(
                  title: 'Security',
                  caption: 'Biometrics, account protection, credentials, and device access.',
                  items: securityItems,
                ),
                const SizedBox(height: 16),
                _SectionCard(
                  title: 'Support & Settings',
                  caption: 'Support access, banking tools, alerts, language, and legal settings.',
                  items: supportAndSettingsItems,
                ),
                const SizedBox(height: 16),
                if (governanceItems.isNotEmpty)
                  _SectionCard(
                    title: 'Shareholder services',
                    caption: 'Governance access, announcements, and voting for eligible members.',
                    items: governanceItems,
                    trailing: const AppNewBadge(),
                  ),
                if (governanceItems.isNotEmpty) const SizedBox(height: 16),
                _SectionCard(
                  title: 'Logout',
                  caption: 'Sign out securely from this device.',
                  items: logoutItems,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ActionItem {
  const _ActionItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.items,
    this.trailing,
    this.caption,
  });

  final String title;
  final List<_ActionItem> items;
  final Widget? trailing;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              if (trailing != null) ...[
                const SizedBox(width: 8),
                trailing!,
              ],
            ],
          ),
          if (caption != null) ...[
            const SizedBox(height: 6),
            Text(
              caption!,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          const SizedBox(height: 8),
          for (var index = 0; index < items.length; index++) ...[
            AppListItem(
              title: items[index].title,
              subtitle: items[index].subtitle,
              icon: items[index].icon,
              onTap: items[index].onTap,
            ),
            if (index != items.length - 1) const Divider(height: 1),
          ],
        ],
      ),
    );
  }
}

void _showProfileSummary(BuildContext context, MemberSession session, MemberProfile? profile) {
  showModalBottomSheet<void>(
    context: context,
    builder: (context) {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('My Profile', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              Text('Customer ID: ${session.customerId}'),
              const SizedBox(height: 4),
              Text('Branch: ${session.branchName}'),
              const SizedBox(height: 4),
              Text('Membership: ${session.membershipStatus.replaceAll('_', ' ')}'),
              const SizedBox(height: 4),
              Text('KYC: ${session.identityVerificationStatus.replaceAll('_', ' ')}'),
              if (profile?.onboardingReviewStatus != null) ...[
                const SizedBox(height: 4),
                Text('Onboarding: ${profile!.onboardingReviewStatus.replaceAll('_', ' ')}'),
              ],
            ],
          ),
        ),
      );
    },
  );
}

void _open(BuildContext context, Widget screen) {
  Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => screen));
}
