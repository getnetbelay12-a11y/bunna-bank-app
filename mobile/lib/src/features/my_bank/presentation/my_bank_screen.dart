import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/member_session.dart';
import '../../account_relationships/presentation/account_relationships_screen.dart';
import '../../autopay/presentation/auto_payment_screen.dart';
import '../../atm_orders/presentation/atm_order_screen.dart';
import '../../chat/presentation/live_chat_list_screen.dart';
import '../../loans/presentation/my_loans_screen.dart';
import '../../phone_number_update/presentation/phone_number_update_screen.dart';
import '../../service_requests/presentation/service_request_list_screen.dart';
import '../../shareholder/presentation/shareholder_dashboard_screen.dart';

class MyBankScreen extends StatelessWidget {
  const MyBankScreen({
    super.key,
    required this.session,
  });

  final MemberSession session;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<List<dynamic>>(
      future: Future.wait<dynamic>([
        session.isShareholder && session.featureFlags.voting
            ? services.votingApi.fetchActiveVotes()
            : Future.value(const []),
      ]),
      builder: (context, snapshot) {
        final hasActiveVote =
            (snapshot.data?.first as List<dynamic>? ?? const []).isNotEmpty;
        final shareholderItems = <_BankFeature>[
          if (session.isShareholder)
            _BankFeature(
              title: 'Shareholder Dashboard',
              subtitle: hasActiveVote
                  ? 'Voting, announcements, and shareholder activity in one place.'
                  : 'Summary, announcements, and future shareholder services.',
              isNew: true,
              icon: Icons.account_balance_rounded,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => ShareholderDashboardScreen(session: session),
                  ),
                );
              },
            ),
        ];

        final items = [
          _BankFeature(
            title: 'Auto Payment',
            subtitle: 'Water, electricity, DSTV, school payment, and future bill rules.',
            isNew: true,
            icon: Icons.autorenew_rounded,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const AutoPaymentScreen(),
                ),
              );
            },
          ),
          _BankFeature(
            title: 'ATM Order',
            subtitle: 'Create a cash pickup request before visiting a branch or ATM.',
            isNew: true,
            icon: Icons.local_atm_rounded,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const AtmOrderScreen(),
                ),
              );
            },
          ),
          _BankFeature(
            title: 'Loan Tracker',
            subtitle: 'Follow workflow status, documents, and repayment milestones.',
            isNew: true,
            icon: Icons.timeline_rounded,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const MyLoansScreen(),
                ),
              );
            },
          ),
          _BankFeature(
            title: 'Service Requests',
            subtitle: 'Track disputes, card requests, phone updates, and account service workflows.',
            isNew: true,
            icon: Icons.assignment_rounded,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const ServiceRequestListScreen(),
                ),
              );
            },
          ),
          _BankFeature(
            title: 'Phone Number Update',
            subtitle: 'Start a verified phone number update request online.',
            isNew: true,
            icon: Icons.phone_android_rounded,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const PhoneNumberUpdateScreen(),
                ),
              );
            },
          ),
          _BankFeature(
            title: 'ABa Care Center',
            subtitle: 'Open live chat, callback, and support guidance.',
            isNew: true,
            icon: Icons.support_agent_rounded,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const LiveChatListScreen(),
                ),
              );
            },
          ),
          _BankFeature(
            title: 'Add Member On Account',
            subtitle:
                'Request joint holder, nominee, authorized user, or family member support.',
            isNew: true,
            icon: Icons.group_add_rounded,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const AccountRelationshipsScreen(),
                ),
              );
            },
          ),
          const _BankFeature(
            title: 'Branch / ATM Locator',
            subtitle: 'Find branches, ATMs, and future location tools.',
            icon: Icons.location_on_outlined,
            onTap: _noop,
          ),
          const _BankFeature(
            title: 'Service Utilities',
            subtitle:
                'Exchange rate, standing order, calculators, and future bank tools.',
            icon: Icons.calculate_outlined,
            onTap: _noop,
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
                  color: abayPrimary,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'My Bank',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Keep the familiar service hub and introduce new features with light blue highlights.',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: const Color(0xFFE4ECFF),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              for (final item in items)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: item.isNew ? const Color(0xFFE8F5FF) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: item.isNew
                          ? const Color(0xFFB9DBFF)
                          : const Color(0xFFD7E2F2),
                    ),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 8,
                    ),
                    leading: Icon(item.icon, color: abayPrimary),
                    title: Row(
                      children: [
                        Expanded(child: Text(item.title)),
                        if (item.isNew)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFD9EEFF),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text(
                              'New',
                              style: TextStyle(
                                color: abayPrimary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                      ],
                    ),
                    subtitle: Text(item.subtitle),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: item.onTap,
                  ),
                ),
              if (shareholderItems.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  'Shareholder Services',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  hasActiveVote
                      ? 'Voting and governance messages are available for eligible shareholder members.'
                      : 'Governance voting appears here only while an event is active.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: abayTextSoft,
                      ),
                ),
                const SizedBox(height: 12),
                for (final item in shareholderItems)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5FF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFB9DBFF)),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 8,
                      ),
                      leading: Icon(item.icon, color: abayPrimary),
                      title: Text(item.title),
                      subtitle: Text(item.subtitle),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: item.onTap,
                    ),
                  ),
              ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _BankFeature {
  const _BankFeature({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    this.isNew = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final bool isNew;
}

void _noop() {}
