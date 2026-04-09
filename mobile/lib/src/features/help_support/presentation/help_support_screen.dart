import 'package:flutter/material.dart';

import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_list_item.dart';
import '../../../shared/widgets/app_new_badge.dart';
import '../../chat/presentation/live_chat_list_screen.dart';
import '../../service_requests/presentation/payment_issue_report_screen.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({
    super.key,
    this.embeddedInTab = false,
  });

  final bool embeddedInTab;

  @override
  Widget build(BuildContext context) {
    final content = ListView(
      padding: EdgeInsets.fromLTRB(20, embeddedInTab ? 12 : 20, 20, 24),
      children: [
        if (embeddedInTab)
          const AppHeader(
            title: 'Support',
            subtitle: 'Live chat, care services, FAQ, and location help in one place.',
          ),
        if (embeddedInTab) const SizedBox(height: 16),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'Live Chat',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(width: 8),
                  const AppNewBadge(),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Start a real-time conversation with support for loans, payments, KYC, or account help.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 14),
              AppButton(
                label: 'Open Live Chat',
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const LiveChatListScreen()),
                  );
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Support Services',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              _SupportRow(
                title: 'ABa Care Center',
                subtitle: 'Get guided support, callback routing, and issue escalation.',
                icon: Icons.support_agent_outlined,
                onTap: () => _showMessage(
                  context,
                  'ABa Care Center is available as the assisted support path for callback and escalation services.',
                ),
              ),
              const Divider(height: 1),
              _SupportRow(
                title: 'FAQ',
                subtitle: 'Common answers for loans, payments, KYC, and service requests.',
                icon: Icons.quiz_outlined,
                onTap: () => _showMessage(
                  context,
                  'FAQ content will load from the service knowledge base.',
                ),
              ),
              const Divider(height: 1),
              _SupportRow(
                title: 'Branch / ATM Locator',
                subtitle: 'Find nearby branches and cash points quickly.',
                icon: Icons.location_on_outlined,
                onTap: () => _showMessage(
                  context,
                  'Branch and ATM locator is staged here as a support utility.',
                ),
              ),
              const Divider(height: 1),
              _SupportRow(
                title: 'Report Payment Problem',
                subtitle: 'Open a payment issue or failed transfer case.',
                icon: Icons.report_problem_outlined,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const PaymentIssueReportScreen()),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );

    if (embeddedInTab) {
      return Material(color: Colors.white, child: SafeArea(top: false, child: content));
    }

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Support'),
      ),
      body: SafeArea(child: content),
    );
  }

  static void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _SupportRow extends StatelessWidget {
  const _SupportRow({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppListItem(
      title: title,
      subtitle: subtitle,
      icon: icon,
      onTap: onTap,
    );
  }
}
