import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';
import '../../../shared/widgets/section_card.dart';

class PaymentsScreen extends StatelessWidget {
  const PaymentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const categories = [
      (
        title: 'School Payment',
        subtitle: 'Tuition and student-related payments.',
        icon: Icons.school_rounded,
      ),
      (
        title: 'Utilities',
        subtitle: 'Everyday utility and household service payments.',
        icon: Icons.home_work_outlined,
      ),
      (
        title: 'Water',
        subtitle: 'Water bill and related service payments.',
        icon: Icons.water_drop_outlined,
      ),
      (
        title: 'Electricity',
        subtitle: 'Electricity bills and power service payments.',
        icon: Icons.bolt_rounded,
      ),
      (
        title: 'Other Payments',
        subtitle: 'General payment services and additional charges.',
        icon: Icons.payments_outlined,
      ),
      (
        title: 'Travel & Hotel',
        subtitle: 'Tickets, reservations, and travel services.',
        icon: Icons.luggage_rounded,
      ),
      (
        title: 'Donation',
        subtitle: 'Charity and community support payments.',
        icon: Icons.volunteer_activism_rounded,
      ),
      (
        title: 'Ticketing',
        subtitle: 'Transport and event ticket payments.',
        icon: Icons.confirmation_number_outlined,
      ),
      (
        title: 'Request to Pay',
        subtitle: 'Approve or process incoming payment requests.',
        icon: Icons.request_quote_outlined,
      ),
      (
        title: '3rd Party Payments',
        subtitle: 'Merchant, supplier, and partner payment services.',
        icon: Icons.swap_horiz_rounded,
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
                color: cbeBlue,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Payments',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Send money, pay bills, buy airtime, and access payment services from one clean banking hub.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFFE5EEFF),
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Primary Actions',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: cbeBlue,
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.08,
              children: const [
                _PrimaryPaymentAction(
                  icon: Icons.swap_horiz_rounded,
                  label: 'Send Money',
                ),
                _PrimaryPaymentAction(
                  icon: Icons.receipt_long_rounded,
                  label: 'Pay Bills',
                ),
                _PrimaryPaymentAction(
                  icon: Icons.phone_android_rounded,
                  label: 'Buy Airtime',
                ),
              ],
            ),
            const SizedBox(height: 20),
            SectionCard(
              title: 'Payment Categories',
              child: Column(
                children: [
                  for (final category in categories) ...[
                    _PaymentCategoryTile(
                      title: category.title,
                      subtitle: category.subtitle,
                      icon: category.icon,
                    ),
                    if (category != categories.last) const Divider(height: 1),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PrimaryPaymentAction extends StatelessWidget {
  const _PrimaryPaymentAction({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 12,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF6D8),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: cbeBlue),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
          ),
        ],
      ),
    );
  }
}

class _PaymentCategoryTile extends StatelessWidget {
  const _PaymentCategoryTile({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: const Color(0xFFEAF2FF),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: cbeBlue),
      ),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right_rounded),
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$title will open here.')),
        );
      },
    );
  }
}
