import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../autopay/presentation/auto_payment_screen.dart';
import '../../school_payments/presentation/school_payment_screen.dart';
import '../../profile/presentation/beneficiary_management_screen.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_list_item.dart';
import 'payment_service_screen.dart';
import 'payment_receipts_screen.dart';
import '../../service_requests/presentation/payment_issue_report_screen.dart';
import 'telecom_services_screen.dart';
import 'transfer_menu_screen.dart';

class PaymentsScreen extends StatelessWidget {
  const PaymentsScreen({
    super.key,
    this.embeddedInTab = false,
  });

  final bool embeddedInTab;

  @override
  Widget build(BuildContext context) {
    const quickActions = [
      ('Send Money', 'Transfer to another person or account.', Icons.send_rounded),
      ('Pay Bills', 'Utility and everyday bill payments.', Icons.receipt_long_outlined),
      ('Telecom Services', 'Airtime, post-paid, and wallet telecom payments.', Icons.phone_android_rounded),
      ('Transfer', 'Move funds between accounts.', Icons.swap_horiz_rounded),
    ];

    const everydayPayments = [
      ('Bill Payment', 'Handle regular bill payment flows.', Icons.receipt_long_outlined),
      ('Utilities', 'Water, electricity, and home payments.', Icons.lightbulb_outline),
      ('School Pay', 'Student-based school fee management.', Icons.school_outlined),
      ('Telecom Services', 'Airtime, post-paid, and telecom wallet services.', Icons.phone_android_rounded),
    ];

    const transferServices = [
      ('Send Money', 'Transfer money to another customer or account.', Icons.send_rounded),
      ('Request to Pay', 'Track incoming and requested collections.', Icons.request_quote_outlined),
      ('Beneficiaries', 'Save and manage trusted recipients.', Icons.people_outline_rounded),
    ];

    const otherServices = [
      ('Travel & Hotel', 'Travel and air ticket payment services.', Icons.flight_takeoff_outlined),
      ('Donation', 'Charity and organization support payments.', Icons.volunteer_activism_outlined),
      ('Event & Ticketing', 'Event and attendance payments.', Icons.confirmation_num_outlined),
      ('3rd Party Payments', 'Approved partner and merchant payments.', Icons.storefront_outlined),
    ];

    final content = ListView(
      padding: EdgeInsets.fromLTRB(20, embeddedInTab ? 12 : 20, 20, 24),
      children: [
            const AppHeader(
              title: 'Payments',
              subtitle: 'Everyday payments, transfers, school fees, and other payment services in one place.',
            ),
            const SizedBox(height: 16),
            AppCard(
              child: GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.15,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  for (final action in quickActions)
                    _ActionTile(
                      icon: action.$3,
                      label: action.$1,
                      subtitle: action.$2,
                      onTap: () {
                        _openPaymentDestination(
                          context,
                          label: action.$1,
                          subtitle: action.$2,
                          icon: action.$3,
                        );
                      },
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _PaymentGroupCard(
              title: 'Everyday Payments',
              caption: 'Daily essentials and recurring household bills.',
              items: everydayPayments,
              onSelected: (label, subtitle, icon) {
                _openPaymentDestination(
                  context,
                  label: label,
                  subtitle: subtitle,
                  icon: icon,
                );
              },
            ),
            const SizedBox(height: 16),
            _PaymentGroupCard(
              title: 'Transfers & Requests',
              caption: 'Move money, request funds, and manage trusted recipients.',
              items: transferServices,
              onSelected: (label, subtitle, icon) {
                _openPaymentDestination(
                  context,
                  label: label,
                  subtitle: subtitle,
                  icon: icon,
                );
              },
            ),
            const SizedBox(height: 16),
            _PaymentGroupCard(
              title: 'Other Services',
              caption: 'Travel, donations, events, and partner payment services.',
              items: otherServices,
              onSelected: (label, subtitle, icon) => _openPaymentDestination(
                context,
                label: label,
                subtitle: subtitle,
                icon: icon,
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
                          'Related Payment Tools',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                      const AppBadge(label: 'Active', tone: AppBadgeTone.neutral),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Operational tools for recurring rules, receipts, and payment follow-up.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 10),
                  AppListItem(
                    title: 'Recurring Payments',
                    subtitle: 'Standing order style rules for utilities, school fees, rent, salary, and savings.',
                    icon: Icons.autorenew_rounded,
                    badge: 'AutoPay',
                    badgeTone: AppBadgeTone.primary,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(builder: (_) => const AutoPaymentScreen()),
                      );
                    },
                  ),
                  const Divider(height: 1),
                  AppListItem(
                    title: 'Payment Receipts',
                    subtitle: 'Review successful payments, QR receipts, and payment cases.',
                    icon: Icons.folder_outlined,
                    badge: 'History',
                    badgeTone: AppBadgeTone.neutral,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(builder: (_) => const PaymentReceiptsScreen()),
                      );
                    },
                  ),
                ],
              ),
            ),
      ],
    );

    if (embeddedInTab) {
      return Material(
        color: Colors.white,
        child: SafeArea(top: false, child: content),
      );
    }

    return AppScaffold(
      title: 'Payments',
      showBack: true,
      body: Material(
        color: Colors.white,
        child: SafeArea(top: false, child: content),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: abayBorder),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: abayAccentSoft,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: abayPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    height: 1.2,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentGroupCard extends StatelessWidget {
  const _PaymentGroupCard({
    required this.title,
    required this.caption,
    required this.items,
    required this.onSelected,
  });

  final String title;
  final String caption;
  final List<(String, String, IconData)> items;
  final void Function(String label, String subtitle, IconData icon) onSelected;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              if (title == 'Everyday Payments')
                const AppBadge(label: 'Core', tone: AppBadgeTone.neutral),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            caption,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 10),
          for (var index = 0; index < items.length; index++) ...[
            AppListItem(
              title: items[index].$1,
              subtitle: items[index].$2,
              icon: items[index].$3,
              onTap: () => onSelected(items[index].$1, items[index].$2, items[index].$3),
            ),
            if (index != items.length - 1) const Divider(height: 1),
          ],
        ],
      ),
    );
  }
}

void _openPaymentDestination(
  BuildContext context, {
  required String label,
  required String subtitle,
  required IconData icon,
}) {
  switch (label) {
    case 'Send Money':
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const TransferMenuScreen()),
      );
      return;
    case 'Transfer':
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const TransferMenuScreen()),
      );
      return;
    case 'School Pay':
    case 'School Payment':
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const SchoolPaymentScreen()),
      );
      return;
    case 'Telecom Services':
    case 'Airtime':
    case 'Buy Airtime':
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const TelecomServicesScreen()),
      );
      return;
    case 'Beneficiaries':
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const BeneficiaryManagementScreen()),
      );
      return;
    case 'Request to Pay':
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const PaymentIssueReportScreen()),
      );
      return;
    default:
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => PaymentServiceScreen(
            title: label,
            subtitle: subtitle,
            icon: icon,
          ),
        ),
      );
  }
}
