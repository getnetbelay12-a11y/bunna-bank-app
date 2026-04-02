import 'package:flutter/material.dart';

import '../../../../theme/cbe_bank_theme.dart';

class BankingActivityTile extends StatelessWidget {
  const BankingActivityTile({
    super.key,
    required this.icon,
    required this.title,
    required this.dateLabel,
    required this.trailingLabel,
    required this.description,
    this.badgeLabel,
    this.badgeColor,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String dateLabel;
  final String trailingLabel;
  final String description;
  final String? badgeLabel;
  final Color? badgeColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: cbeBlue.withValues(alpha: 0.08)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x12000000),
              blurRadius: 12,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: const Color(0xFFE9F1FF),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: cbeBlue),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        trailingLabel,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              color: cbeBlue,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    dateLabel,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: const Color(0xFF6B7280),
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(description),
                  if (badgeLabel != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: (badgeColor ?? cbeBlue).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        badgeLabel!,
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: badgeColor ?? cbeBlue,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
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
