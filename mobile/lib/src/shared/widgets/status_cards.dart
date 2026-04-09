import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';

enum StatusCardTone {
  info,
  success,
  warning,
  danger,
  neutral,
}

class StatusBannerCard extends StatelessWidget {
  const StatusBannerCard({
    super.key,
    required this.message,
    this.title,
    this.tone = StatusCardTone.info,
  });

  final String message;
  final String? title;
  final StatusCardTone tone;

  @override
  Widget build(BuildContext context) {
    final palette = _StatusPalette.fromTone(tone);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: palette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Text(
              title!,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: palette.foreground,
                  ),
            ),
            const SizedBox(height: 6),
          ],
          Text(
            message,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: tone == StatusCardTone.neutral ? null : palette.foreground,
                ),
          ),
        ],
      ),
    );
  }
}

class DetailLinesCard extends StatelessWidget {
  const DetailLinesCard({
    super.key,
    required this.items,
    this.tone = StatusCardTone.info,
  });

  final List<DetailLineItem> items;
  final StatusCardTone tone;

  @override
  Widget build(BuildContext context) {
    final palette = _StatusPalette.fromTone(tone);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: palette.border),
      ),
      child: Column(
        children: [
          for (var index = 0; index < items.length; index++) ...[
            DetailLine(
              label: items[index].label,
              value: items[index].value,
            ),
            if (index != items.length - 1) const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}

class DetailLine extends StatelessWidget {
  const DetailLine({
    super.key,
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: abayTextSoft,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
        ),
      ],
    );
  }
}

class ChecklistCard extends StatelessWidget {
  const ChecklistCard({
    super.key,
    required this.title,
    required this.points,
    this.tone = StatusCardTone.neutral,
    this.icon = Icons.check_circle_outline_rounded,
  });

  final String title;
  final List<String> points;
  final StatusCardTone tone;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final palette = _StatusPalette.fromTone(tone);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: palette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: tone == StatusCardTone.neutral ? null : palette.foreground,
                ),
          ),
          const SizedBox(height: 12),
          for (var index = 0; index < points.length; index++) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Icon(icon, size: 18, color: palette.foreground),
                ),
                const SizedBox(width: 10),
                Expanded(child: Text(points[index])),
              ],
            ),
            if (index != points.length - 1) const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}

class DetailLineItem {
  const DetailLineItem({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;
}

class _StatusPalette {
  const _StatusPalette({
    required this.background,
    required this.border,
    required this.foreground,
  });

  final Color background;
  final Color border;
  final Color foreground;

  factory _StatusPalette.fromTone(StatusCardTone tone) {
    switch (tone) {
      case StatusCardTone.success:
        return const _StatusPalette(
          background: abaySuccessBg,
          border: Color(0xFFBEDCCB),
          foreground: abaySuccess,
        );
      case StatusCardTone.warning:
        return const _StatusPalette(
          background: abayWarningBg,
          border: Color(0xFFE9D19A),
          foreground: abayWarning,
        );
      case StatusCardTone.danger:
        return const _StatusPalette(
          background: abayDangerBg,
          border: Color(0xFFE1B8B8),
          foreground: abayDanger,
        );
      case StatusCardTone.neutral:
        return const _StatusPalette(
          background: Colors.white,
          border: Color(0xFFD8E3F5),
          foreground: abayPrimary,
        );
      case StatusCardTone.info:
        return const _StatusPalette(
          background: abayInfoBg,
          border: Color(0xFFB9DBFF),
          foreground: abayPrimary,
        );
    }
  }
}
