import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import 'app_badge.dart';
import 'app_tile.dart';

class AppListItem extends StatelessWidget {
  const AppListItem({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.onTap,
    this.badge,
    this.badgeTone = AppBadgeTone.primary,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final IconData? icon;
  final VoidCallback? onTap;
  final String? badge;
  final AppBadgeTone badgeTone;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return AppTile(
      title: title,
      subtitle: subtitle,
      onTap: onTap,
      leading: icon == null
          ? null
          : Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: abaySurfaceAlt,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: abayPrimary),
            ),
      trailing: trailing ??
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerRight,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                if (badge?.isNotEmpty == true) ...[
                  AppBadge(
                    label: badge!,
                    tone: badgeTone,
                  ),
                  const SizedBox(width: 8),
                ],
                const Icon(Icons.chevron_right_rounded, color: abayTextSoft),
              ],
            ),
          ),
    );
  }
}
