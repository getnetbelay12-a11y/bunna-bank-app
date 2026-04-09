import 'package:flutter/widgets.dart';

import '../../help_support/presentation/help_support_screen.dart';

class SupportHomeScreen extends StatelessWidget {
  const SupportHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const HelpSupportScreen(embeddedInTab: true);
  }
}
