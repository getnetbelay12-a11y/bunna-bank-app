import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';

class ShareholderAnnouncementsScreen extends StatelessWidget {
  const ShareholderAnnouncementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const announcements = [
      (
        title: 'AGM Notice',
        message: 'Annual general meeting notice for shareholder members.',
        label: 'Announcement',
      ),
      (
        title: 'Dividend Update',
        message: 'Dividend communication and payout preparation guidance.',
        label: 'Shareholder',
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Shareholder Services'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5FF),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFB9DBFF)),
              ),
              child: const Text(
                'Active voting and announcements appear here only for eligible shareholder members.',
              ),
            ),
            const SizedBox(height: 16),
            for (final item in announcements)
              Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: const Icon(
                    Icons.campaign_rounded,
                    color: cbeBlue,
                  ),
                  title: Text(item.title),
                  subtitle: Text(item.message),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD9EEFF),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      item.label,
                      style: const TextStyle(
                        color: cbeBlue,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
