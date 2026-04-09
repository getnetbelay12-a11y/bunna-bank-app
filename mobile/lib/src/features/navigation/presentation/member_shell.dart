import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/member_session.dart';
import '../../chat/presentation/support_home_screen.dart';
import '../../home/presentation/home_dashboard_screen.dart';
import '../../membership/presentation/fayda_verification_screen.dart';
import '../../notifications/presentation/notifications_screen.dart';
import '../../payments/presentation/payments_screen.dart';
import '../../profile/presentation/profile_screen.dart';
import '../../settings/presentation/settings_screen.dart';
import '../../transactions/presentation/transactions_screen.dart';

class MemberShell extends StatefulWidget {
  const MemberShell({
    super.key,
    required this.session,
  });

  final MemberSession session;

  @override
  State<MemberShell> createState() => _MemberShellState();
}

class _MemberShellState extends State<MemberShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final tabs = _buildTabs(widget.session);
    final currentTab = tabs[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(currentTab.label),
            Text(
              widget.session.branchName,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: abayTopBarMuted,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () {
              controller.markInteraction();
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const NotificationsScreen(),
                ),
              );
            },
          ),
        ],
        leading: _currentIndex == 0
            ? Builder(
                builder: (context) => IconButton(
                  icon: const Icon(Icons.menu_rounded),
                  onPressed: () {
                    controller.markInteraction();
                    Scaffold.of(context).openDrawer();
                  },
                ),
              )
            : IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () {
                  controller.markInteraction();
                  setState(() {
                    _currentIndex = 0;
                  });
                },
              ),
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    bottom: BorderSide(color: abayBorder),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.session.fullName,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.session.customerId,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: abayTextSoft,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(widget.session.branchName),
                  ],
                ),
              ),
              const Divider(),
              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    _DrawerItem(label: 'Home', icon: Icons.home_rounded, onTap: () => _switchTab(context, 0)),
                    _DrawerItem(label: 'Payments', icon: Icons.payments_rounded, onTap: () => _switchTab(context, 1)),
                    _DrawerItem(label: 'Transactions', icon: Icons.receipt_long_rounded, onTap: () => _switchTab(context, 2)),
                    _DrawerItem(label: 'Support', icon: Icons.chat_bubble_rounded, onTap: () => _switchTab(context, 3)),
                    _DrawerItem(label: 'Profile', icon: Icons.person_rounded, onTap: () => _switchTab(context, 4)),
                    _DrawerItem(
                      label: 'Notifications',
                      icon: Icons.notifications_none_rounded,
                      onTap: () {
                        Navigator.of(context).pop();
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const NotificationsScreen(),
                          ),
                        );
                      },
                    ),
                    _DrawerItem(
                      label: 'KYC Verification',
                      icon: Icons.verified_user_rounded,
                      onTap: () {
                        Navigator.of(context).pop();
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const FaydaVerificationScreen(),
                          ),
                        );
                      },
                    ),
                    _DrawerItem(
                      label: 'Security Settings',
                      icon: Icons.lock_rounded,
                      onTap: () {
                        Navigator.of(context).pop();
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const SettingsScreen(),
                          ),
                        );
                      },
                    ),
                    _DrawerItem(
                      label: 'About',
                      icon: Icons.info_outline_rounded,
                      onTap: () {
                        Navigator.of(context).pop();
                        showAboutDialog(
                          context: context,
                          applicationName: 'Bunna Bank',
                          applicationVersion: '0.1.0',
                          children: const [
                            Text(
                              'Simple Ethiopian banking-style mobile experience for members, KYC, loans, and notifications.',
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: FilledButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    controller.logout();
                  },
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Logout'),
                ),
              ),
            ],
          ),
        ),
      ),
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: KeyedSubtree(
            key: ValueKey(currentTab.label),
            child: currentTab.screen,
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: abayPrimary,
        selectedItemColor: abayAccent,
        unselectedItemColor: abayNavUnselected,
        type: BottomNavigationBarType.fixed,
        items: [
          for (final tab in tabs)
            BottomNavigationBarItem(
              icon: Icon(tab.icon),
              label: tab.label,
            ),
        ],
        onTap: (index) {
          controller.markInteraction();
          setState(() {
            _currentIndex = index;
          });
        },
      ),
    );
  }

  List<_MemberTab> _buildTabs(MemberSession session) {
    return [
      _MemberTab(
        label: 'Home',
        icon: Icons.home_rounded,
        screen: HomeDashboardScreen(session: session),
      ),
      const _MemberTab(
        label: 'Payments',
        icon: Icons.payments_rounded,
        screen: PaymentsScreen(embeddedInTab: true),
      ),
      const _MemberTab(
        label: 'Transactions',
        icon: Icons.receipt_long_rounded,
        screen: TransactionsScreen(embeddedInTab: true),
      ),
      const _MemberTab(
        label: 'Support',
        icon: Icons.chat_bubble_rounded,
        screen: SupportHomeScreen(),
      ),
      _MemberTab(
        label: 'Profile',
        icon: Icons.person_rounded,
        screen: ProfileScreen(session: session),
      ),
    ];
  }

  void _switchTab(BuildContext context, int index) {
    AppScope.of(context).markInteraction();
    Navigator.of(context).pop();
    setState(() {
      _currentIndex = index;
    });
  }
}

class _MemberTab {
  const _MemberTab({
    required this.label,
    required this.icon,
    required this.screen,
  });

  final String label;
  final IconData icon;
  final Widget screen;
}

class _DrawerItem extends StatelessWidget {
  const _DrawerItem({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: abayPrimary),
      title: Text(label),
      onTap: onTap,
    );
  }
}
