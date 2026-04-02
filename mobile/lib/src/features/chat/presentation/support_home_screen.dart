import 'package:flutter/widgets.dart';

import 'live_chat_list_screen.dart';

class SupportHomeScreen extends StatelessWidget {
  const SupportHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const LiveChatListScreen(embeddedInTab: true);
  }
}
