import 'package:flutter/material.dart';

import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_list_item.dart';

class BankingServicesScreen extends StatelessWidget {
  const BankingServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const tools = [
      ('Branch / ATM Locator', 'Find nearby branches and ATMs before visiting.', Icons.location_on_outlined),
      ('Exchange Rate', 'Check current major currency rates.', Icons.currency_exchange_outlined),
      ('Loan Calculator', 'Estimate installments before applying.', Icons.calculate_outlined),
      ('Authenticator', 'Review secure verification tools and trusted approval methods.', Icons.verified_user_outlined),
      ('Fast Track', 'Priority service routing for urgent banking needs.', Icons.flash_on_outlined),
      ('Spending Insights', 'Track spending patterns and monthly habits.', Icons.insights_outlined),
    ];

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Banking Services'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const AppHeader(
              title: 'Service Tools',
              subtitle: 'Useful banking utilities kept outside Home so daily banking stays simple.',
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                children: [
                  for (var index = 0; index < tools.length; index++) ...[
                    AppListItem(
                      title: tools[index].$1,
                      subtitle: tools[index].$2,
                      icon: tools[index].$3,
                      onTap: () => _showComingSoon(context, tools[index].$1),
                    ),
                    if (index != tools.length - 1) const Divider(height: 1),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static void _showComingSoon(BuildContext context, String title) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$title is available as a service area and ready for deeper backend integration.')),
    );
  }
}
