import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../demo/demo_mode.dart';

class AppNewBadge extends StatelessWidget {
  const AppNewBadge({super.key});

  @override
  Widget build(BuildContext context) {
    if (!isDemoMode) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: abayInfoBg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: abaySecondarySoft),
      ),
      child: Text(
        'NEW',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: abayPrimary,
              fontWeight: FontWeight.w800,
            ),
      ),
    );
  }
}
