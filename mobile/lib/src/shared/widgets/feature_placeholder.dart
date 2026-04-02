import 'package:flutter/material.dart';
import '../../../theme/cbe_bank_theme.dart';

class FeaturePlaceholder extends StatelessWidget {
  const FeaturePlaceholder({
    super.key,
    required this.title,
    required this.description,
    this.actions = const [],
    this.child,
  });

  final String title;
  final String description;
  final List<Widget> actions;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: const Color(0xFF5C5C5C),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            width: 56,
            height: 4,
            decoration: BoxDecoration(
              color: cbeLightBlue,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          const SizedBox(height: 20),
          if (actions.isNotEmpty) ...[
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: actions,
            ),
            const SizedBox(height: 20),
          ],
          if (child != null) child!,
        ],
      ),
    );
  }
}
