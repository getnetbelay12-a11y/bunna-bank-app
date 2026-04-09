import 'package:flutter/material.dart';

import '../../../core/widgets/app_scaffold.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_list_item.dart';

class PaymentServiceScreen extends StatelessWidget {
  const PaymentServiceScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.primaryActionLabel = 'Continue',
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String primaryActionLabel;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: title,
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AppHeader(
            title: title,
            subtitle: subtitle,
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF2BF),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(icon, color: const Color(0xFF0A4FA3)),
                ),
                const SizedBox(height: 16),
                Text(
                  'Service Overview',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'This service is active in the payments hub and ready for the next transaction flow step.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                AppButton(
                  label: primaryActionLabel,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('$title is available from this payments workspace.'),
                      ),
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
                  'What you can do here',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                AppListItem(
                  title: 'Review service details',
                  subtitle: 'Understand the payment flow and required information.',
                  icon: Icons.info_outline_rounded,
                  onTap: () {},
                ),
                const Divider(height: 1),
                AppListItem(
                  title: 'Continue with payment',
                  subtitle: 'Start or resume the next payment step for this service.',
                  icon: Icons.arrow_forward_rounded,
                  onTap: () {},
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
