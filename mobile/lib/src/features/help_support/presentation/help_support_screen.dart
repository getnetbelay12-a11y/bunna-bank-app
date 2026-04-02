import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';
import '../../chat/presentation/live_chat_list_screen.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Help & Support'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x14000000),
                    blurRadius: 14,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Get help quickly',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Live chat is the fastest support path. You can also request a callback, review FAQs, report a problem, or escalate a service issue.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: const Color(0xFF64748B),
                        ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: cbeLightBlue.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: cbeLightBlue.withValues(alpha: 0.55),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.support_agent_rounded,
                          color: cbeBlue,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Live Chat is connected to the support console for two-way replies.',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: cbeBlue,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const LiveChatListScreen(),
                          ),
                        );
                      },
                      icon: const Icon(Icons.chat_bubble_rounded),
                      label: const Text('Start Live Chat'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _SupportOptionCard(
              icon: Icons.call_rounded,
              title: 'Call Support',
              subtitle:
                  'Request a branch callback or call the customer service team.',
              onTap: (context) => _showMessage(
                context,
                'Call support routing is ready for real phone integration.',
              ),
            ),
            _SupportOptionCard(
              icon: Icons.quiz_rounded,
              title: 'FAQ',
              subtitle:
                  'View common answers for loans, KYC, payments, and account help.',
              onTap: (context) => _showMessage(
                context,
                'FAQ content will be loaded from the service knowledge base.',
              ),
            ),
            _SupportOptionCard(
              icon: Icons.report_problem_rounded,
              title: 'Report a Problem',
              subtitle:
                  'Report payment failures, login issues, and document upload problems.',
              onTap: (context) => _showMessage(
                context,
                'Problem reporting can be submitted through Live Chat for now.',
              ),
            ),
            _SupportOptionCard(
              icon: Icons.escalator_warning_rounded,
              title: 'Escalation Help',
              subtitle:
                  'Get assistance when a support issue needs branch or manager follow-up.',
              onTap: (context) => _showMessage(
                context,
                'Escalation support is handled from the live support conversation.',
              ),
            ),
          ],
        ),
      ),
    );
  }

  static void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

class _SupportOptionCard extends StatelessWidget {
  const _SupportOptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final void Function(BuildContext context) onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: const Color(0xFFEAF2FF),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(icon, color: cbeBlue),
        ),
        title: Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(subtitle),
        ),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: () => onTap(context),
      ),
    );
  }
}
