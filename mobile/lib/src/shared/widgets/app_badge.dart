import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';

enum AppBadgeTone {
  primary,
  success,
  warning,
  danger,
  neutral,
}

class AppBadge extends StatelessWidget {
  const AppBadge({
    super.key,
    required this.label,
    this.tone = AppBadgeTone.primary,
  });

  final String label;
  final AppBadgeTone tone;

  @override
  Widget build(BuildContext context) {
    final colors = switch (tone) {
      AppBadgeTone.primary => (abayAccentSoft, abayAccentText),
      AppBadgeTone.success => (abaySuccessBg, abaySuccess),
      AppBadgeTone.warning => (abayWarningBg, abayWarning),
      AppBadgeTone.danger => (abayDangerBg, abayDanger),
      AppBadgeTone.neutral => (abaySurfaceAlt, abayTextSoft),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: colors.$2,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.1,
            ),
      ),
    );
  }
}
