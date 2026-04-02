import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/banking_activity_tile.dart';
import '../../account_relationships/presentation/account_relationships_screen.dart';
import '../../atm_card_order/presentation/atm_card_order_screen.dart';
import '../../autopay/presentation/auto_payment_screen.dart';
import '../../chat/presentation/live_chat_list_screen.dart';
import '../../loans/presentation/loan_detail_screen.dart';
import '../../notifications/presentation/notifications_screen.dart';
import '../../payments/presentation/payments_screen.dart';
import '../../phone_number_update/presentation/phone_number_update_screen.dart';
import '../../settings/presentation/settings_screen.dart';
import '../../voting/presentation/voting_screen.dart';

const Color _homePrimaryPurple = Color(0xFF7A1618);
const Color _homeDeepPurple = Color(0xFF5B0F12);
const Color _homeLightPurple = Color(0xFFF7F1EF);
const Color _homeAccentGold = Color(0xFFC49A3A);
const Color _homeDarkText = Color(0xFF1F1F1F);
const Color _homeMutedText = Color(0xFF6B7280);

class HomeDashboardScreen extends StatefulWidget {
  const HomeDashboardScreen({
    super.key,
    required this.session,
  });

  final MemberSession session;

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  bool _hideBalance = true;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final theme = Theme.of(context);

    return FutureBuilder<MemberHomeData>(
      future: _loadHomeData(services, widget.session),
      builder: (context, snapshot) {
        final homeData = snapshot.data;
        final session = widget.session;
        final display = _HomeDisplayData.resolve(
          session: session,
          homeData: homeData,
        );
        final savingsLabel = _hideBalance
            ? '${display.currency} ••••••••'
            : '${display.currency} ${display.balanceLabel}';

        final serviceItems = _buildServiceItems(context, session);

        return Material(
          color: _homeLightPurple,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: _homeAccentGold,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  display.customerName,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: _homeDarkText,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${display.branchName} • ${display.customerId}',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: _homeMutedText,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [_homePrimaryPurple, _homeDeepPurple],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x22000000),
                        blurRadius: 18,
                        offset: Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Available Balance',
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: const Color(0xFFF2D38D),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              savingsLabel,
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              display.accountType,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFFE9DDFB),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              display.maskedAccountNumber,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFFDCCCF7),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            _hideBalance = !_hideBalance;
                          });
                        },
                        icon: Icon(
                          _hideBalance
                              ? Icons.visibility_off_rounded
                              : Icons.visibility_rounded,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.02,
                  children: [
                    _QuickShortcut(
                      icon: Icons.swap_horiz_rounded,
                      label: 'Send Money',
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const PaymentsScreen(),
                          ),
                        );
                      },
                    ),
                    _QuickShortcut(
                      icon: Icons.receipt_long_rounded,
                      label: 'Pay Bills',
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const PaymentsScreen(),
                          ),
                        );
                      },
                    ),
                    _QuickShortcut(
                      icon: Icons.phone_android_rounded,
                      label: 'Airtime',
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const PaymentsScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Text(
                      'Services',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE9DDFB),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'New',
                        style: TextStyle(
                          color: _homePrimaryPurple,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Manage new digital services from one clean grid without crowding the Home screen.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: _homeMutedText,
                  ),
                ),
                const SizedBox(height: 12),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: serviceItems.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.28,
                  ),
                  itemBuilder: (context, index) {
                    final item = serviceItems[index];
                    return _ServiceTile(item: item);
                  },
                ),
                const SizedBox(height: 20),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x0F000000),
                        blurRadius: 12,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Notifications',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const Spacer(),
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) => const NotificationsScreen(),
                                ),
                              );
                            },
                            child: const Text('View all'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (homeData == null || homeData.notifications.isEmpty)
                        Text(
                          'Loan, insurance, payment, and announcement alerts will appear here.',
                          style: theme.textTheme.bodyMedium,
                        )
                      else
                        Column(
                          children: [
                            for (final item in homeData.notifications.take(2)) ...[
                              _NotificationPreviewTile(notification: item),
                              if (item != homeData.notifications.take(2).last)
                                const SizedBox(height: 12),
                            ],
                          ],
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x0F000000),
                        blurRadius: 12,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Promotions & Announcements',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Digital service upgrades are rolling out gradually. Auto Payment, Live Chat, shareholder services, and remote account updates are now easier to access from Home.',
                      ),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F5FF),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFB9DBFF)),
                        ),
                        child: const Text(
                          'Use the Services grid above to open new banking features. Features still under rollout will show an in-app placeholder message.',
                          style: TextStyle(
                            color: _homePrimaryPurple,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<MemberHomeData> _loadHomeData(
    dynamic services,
    MemberSession session,
  ) async {
    final profile = await services.memberApi.fetchMyProfile(session.memberId);
    final results = await Future.wait<dynamic>([
      services.savingsApi.fetchMyAccounts(session.memberId),
      services.loanApi.fetchMyLoans(),
      services.notificationApi.fetchMyNotifications(),
    ]);
    final accounts = results[0] as List<SavingsAccount>;
    final loans = results[1] as List<LoanSummary>;
    final notifications = results[2] as List<AppNotification>;

    return MemberHomeData(
      profile: profile,
      accounts: accounts,
      loans: loans,
      notifications: notifications,
      recentNotificationsCount:
          notifications.where((item) => item.status != 'read').length,
    );
  }

  List<_ServiceItem> _buildServiceItems(
    BuildContext context,
    MemberSession session,
  ) {
    final items = <_ServiceItem>[
      _ServiceItem(
        title: 'Auto Payment',
        icon: Icons.receipt_long_rounded,
        description: 'Water, electricity, DSTV, and school fees.',
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const AutoPaymentScreen(),
          ),
        ),
      ),
      _ServiceItem(
        title: 'Account Lock',
        icon: Icons.lock_rounded,
        description: 'Enable or disable account lock.',
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const SettingsScreen(),
          ),
        ),
      ),
      _ServiceItem(
        title: 'ATM Card Order',
        icon: Icons.credit_card_rounded,
        description: 'Request a new ATM card from the app.',
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const AtmCardOrderScreen(),
          ),
        ),
      ),
      _ServiceItem(
        title: 'Notifications',
        icon: Icons.notifications_none_rounded,
        description: 'Loan, insurance, payment, and bank updates.',
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const NotificationsScreen(),
          ),
        ),
      ),
      _ServiceItem(
        title: 'Live Chat',
        icon: Icons.chat_bubble_outline_rounded,
        description: 'Talk to support agents through the console flow.',
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const LiveChatListScreen(),
          ),
        ),
      ),
      _ServiceItem(
        title: 'Loan Workflow',
        icon: Icons.description_outlined,
        description: 'Track loan status and timeline updates.',
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const LoanDetailScreen(),
          ),
        ),
      ),
      _ServiceItem(
        title: 'Update Phone',
        icon: Icons.phone_iphone_rounded,
        description: 'Change your phone with Fayda and selfie checks.',
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const PhoneNumberUpdateScreen(),
          ),
        ),
      ),
      _ServiceItem(
        title: 'Add Member',
        icon: Icons.person_add_alt_1_rounded,
        description: 'Add family or co-members to your account.',
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const AccountRelationshipsScreen(),
          ),
        ),
      ),
    ];

    if (session.canVote) {
      items.insert(
        6,
        _ServiceItem(
          title: 'Voting',
          icon: Icons.how_to_vote_rounded,
          description: 'Shareholder-only annual voting and proposals.',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => const VotingScreen(),
            ),
          ),
        ),
      );
    }

    return items;
  }
}

class _QuickShortcut extends StatelessWidget {
  const _QuickShortcut({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF6D8),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(icon, color: _homePrimaryPurple),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
          ),
        ],
      ),
    );
  }
}

class MemberHomeData {
  const MemberHomeData({
    required this.profile,
    required this.accounts,
    required this.loans,
    required this.notifications,
    required this.recentNotificationsCount,
  });

  final MemberProfile profile;
  final List<SavingsAccount> accounts;
  final List<LoanSummary> loans;
  final List<AppNotification> notifications;
  final int recentNotificationsCount;

  String get primaryBalanceLabel {
    if (accounts.isEmpty) {
      return '0';
    }

    return accounts.first.balance.toStringAsFixed(0);
  }
}

class _ServiceItem {
  const _ServiceItem({
    required this.title,
    required this.icon,
    required this.description,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final String description;
  final VoidCallback onTap;
}

class _ServiceTile extends StatelessWidget {
  const _ServiceTile({
    required this.item,
  });

  final _ServiceItem item;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: item.onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFD7E2F2)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0C000000),
              blurRadius: 10,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFF1E8FB),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(item.icon, color: _homePrimaryPurple),
            ),
            const Spacer(),
            Text(
              item.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              item.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF64748B),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationPreviewTile extends StatelessWidget {
  const _NotificationPreviewTile({
    required this.notification,
  });

  final AppNotification notification;

  @override
  Widget build(BuildContext context) {
    return BankingActivityTile(
      icon: Icons.notifications_active_outlined,
      title: notification.title,
      dateLabel: '${notification.createdAt.month}/${notification.createdAt.day}',
      trailingLabel: notification.status == 'read' ? 'Read' : 'New',
      description: notification.message,
      badgeLabel: notification.type.replaceAll('_', ' ').toUpperCase(),
      badgeColor: notification.status == 'read'
          ? _homeMutedText
          : _homeAccentGold,
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const NotificationsScreen(),
          ),
        );
      },
    );
  }
}

class _HomeDisplayData {
  const _HomeDisplayData({
    required this.customerName,
    required this.branchName,
    required this.customerId,
    required this.accountType,
    required this.maskedAccountNumber,
    required this.balanceLabel,
    required this.currency,
  });

  final String customerName;
  final String branchName;
  final String customerId;
  final String accountType;
  final String maskedAccountNumber;
  final String balanceLabel;
  final String currency;

  static const _sample = _HomeDisplayData(
    customerName: 'Abebe Kebede',
    branchName: 'Piassa Branch',
    customerId: 'CUST-1001',
    accountType: 'Primary Savings Account',
    maskedAccountNumber: '1000******45',
    balanceLabel: '245,860.75',
    currency: 'ETB',
  );

  static _HomeDisplayData resolve({
    required MemberSession session,
    required MemberHomeData? homeData,
  }) {
    final profile = homeData?.profile;
    final isDemoLike = (profile?.fullName ?? session.fullName).toLowerCase().contains('demo') ||
        (profile?.branchName ?? session.branchName).toLowerCase().contains('demo') ||
        session.customerId.toUpperCase() == _sample.customerId;

    if (homeData == null || isDemoLike) {
      return _sample;
    }

    final maskedAccountNumber = homeData.accounts.isNotEmpty
        ? _maskAccountNumber(homeData.accounts.first.accountNumber)
        : _sample.maskedAccountNumber;

    return _HomeDisplayData(
      customerName: profile?.fullName.isNotEmpty == true
          ? profile!.fullName
          : _sample.customerName,
      branchName: profile?.branchName.isNotEmpty == true
          ? profile!.branchName
          : _sample.branchName,
      customerId: profile?.customerId.isNotEmpty == true
          ? profile!.customerId
          : session.customerId,
      accountType: 'Primary Savings Account',
      maskedAccountNumber: maskedAccountNumber,
      balanceLabel: homeData.primaryBalanceLabel,
      currency: homeData.accounts.isNotEmpty
          ? homeData.accounts.first.currency
          : _sample.currency,
    );
  }
}

String _maskAccountNumber(String accountNumber) {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }

  final prefix = accountNumber.length >= 4 ? accountNumber.substring(0, 4) : accountNumber;
  final suffix = accountNumber.substring(accountNumber.length - 2);
  return '$prefix******$suffix';
}
