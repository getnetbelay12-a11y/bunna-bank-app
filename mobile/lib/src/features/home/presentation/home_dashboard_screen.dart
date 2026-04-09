import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_list_item.dart';
import '../../../shared/widgets/app_new_badge.dart';
import '../../loans/presentation/loan_detail_screen.dart';
import '../../loans/presentation/my_loans_screen.dart';
import '../../chat/presentation/live_chat_list_screen.dart';
import '../../notifications/presentation/notifications_screen.dart';
import '../../payments/presentation/payments_screen.dart';
import '../../payments/presentation/telebirr_transfer_screen.dart';
import '../../school_payments/presentation/school_payment_screen.dart';
import '../../payments/presentation/telecom_services_screen.dart';
import '../../payments/presentation/transfer_menu_screen.dart';
import '../../transactions/presentation/transactions_screen.dart';
import '../../shareholder/presentation/shareholder_dashboard_screen.dart';
import '../../membership/presentation/fayda_verification_screen.dart';
import '../../autopay/presentation/auto_payment_screen.dart';
import '../../phone_number_update/presentation/phone_number_update_screen.dart';
import '../../account_relationships/presentation/account_relationships_screen.dart';
import '../../atm_card_order/presentation/atm_card_order_screen.dart';
import '../../notifications/presentation/notification_navigation.dart';
import '../../settings/presentation/settings_screen.dart';

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
  Timer? _refreshTimer;
  String? _latestForegroundNotificationId;
  bool _notificationFeedInitialized = false;

  @override
  void initState() {
    super.initState();
    _refreshTimer = Timer.periodic(const Duration(seconds: 6), (_) {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return FutureBuilder<MemberHomeData>(
      future: _loadHomeData(services, widget.session),
      builder: (context, snapshot) {
        final homeData = snapshot.data;
        final profile = homeData?.profile;
        final balance = homeData?.primaryBalanceLabel ?? '0';
        final insights =
            homeData?.insights.items.take(2).toList() ?? const <SmartInsight>[];
        final allNotifications =
            homeData?.notifications ?? const <AppNotification>[];
        LoanSummary? activeLoan;
        if (homeData != null) {
          for (final loan in homeData.loans) {
            if (loan.status != 'rejected') {
              activeLoan = loan;
              break;
            }
          }
        }
        final featureHighlights = _buildFeatureHighlights(
          hasActiveLoan: activeLoan != null,
          isShareholder: widget.session.isShareholder,
        );

        if (homeData != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _maybeShowLiveNotification(allNotifications);
          });
        }

        return Material(
          color: Colors.white,
          child: SafeArea(
            bottom: false,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              children: [
                AppHeader(
                  title: 'Hello, ${_firstName(widget.session.fullName)}',
                  subtitle: widget.session.branchName,
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: abayPrimary,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(
                        color: abayShadow,
                        blurRadius: 18,
                        offset: Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Available balance',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white70,
                            ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              _hideBalance ? 'ETB •••••••' : 'ETB $balance',
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              setState(() {
                                _hideBalance = !_hideBalance;
                              });
                            },
                            color: Colors.white,
                            icon: Icon(
                              _hideBalance
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        profile?.memberNumber ?? widget.session.customerId,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white70,
                            ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 4,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 0.92,
                  children: [
                    _QuickAction(
                      icon: Icons.send_rounded,
                      label: 'Transfer',
                      onTap: () => _open(context, const TransferMenuScreen()),
                    ),
                    _QuickAction(
                      icon: Icons.account_balance_wallet_outlined,
                      label: 'Telebirr',
                      onTap: () =>
                          _open(context, const TelebirrTransferScreen()),
                    ),
                    _QuickAction(
                      icon: Icons.phone_android_rounded,
                      label: 'Telecom',
                      onTap: () =>
                          _open(context, const TelecomServicesScreen()),
                    ),
                    _QuickAction(
                      icon: Icons.support_agent_outlined,
                      label: 'Support',
                      onTap: () => _open(context, const LiveChatListScreen()),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'New and improved',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ),
                          const AppNewBadge(),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'See the key upgrades now available in your Bunna Bank app.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: abayTextSoft,
                            ),
                      ),
                      const SizedBox(height: 8),
                      for (var index = 0;
                          index < featureHighlights.length;
                          index++) ...[
                        AppListItem(
                          title: featureHighlights[index].title,
                          subtitle: featureHighlights[index].subtitle,
                          icon: featureHighlights[index].icon,
                          badge: featureHighlights[index].badge,
                          onTap: () => featureHighlights[index].onTap(context),
                        ),
                        if (index != featureHighlights.length - 1)
                          const Divider(height: 1),
                      ],
                    ],
                  ),
                ),
                if (activeLoan != null) ...[
                  const SizedBox(height: 16),
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                activeLoan.isRepaymentActive
                                    ? 'Active loan'
                                    : 'Loan status',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                            ),
                            AppBadge(
                              label: _loanStatusLabel(activeLoan.status),
                              tone: activeLoan.isRepaymentActive
                                  ? AppBadgeTone.success
                                  : AppBadgeTone.primary,
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          activeLoan.loanType,
                          style:
                              Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                        ),
                        const SizedBox(height: 14),
                        if (activeLoan.isRepaymentActive)
                          Row(
                            children: [
                              Expanded(
                                child: _LoanMetric(
                                  label: 'You pay',
                                  value:
                                      'ETB ${activeLoan.estimatedMonthlyPayment.toStringAsFixed(0)}',
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _LoanMetric(
                                  label: 'Remaining',
                                  value:
                                      'ETB ${activeLoan.estimatedRemainingBalance.toStringAsFixed(0)}',
                                ),
                              ),
                            ],
                          )
                        else
                          Text(
                            'Your application is in ${_loanStatusLabel(activeLoan.currentLevel).toLowerCase()}. Repayment details will appear after approval.',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: abayTextSoft,
                                ),
                          ),
                        const SizedBox(height: 12),
                        _LoanMetric(
                          label: activeLoan.isRepaymentActive
                              ? 'Next payment'
                              : 'Next action',
                          value: activeLoan.isRepaymentActive
                              ? _formatLoanDate(activeLoan.nextPaymentDate)
                              : _nextLoanAction(activeLoan),
                        ),
                        const SizedBox(height: 14),
                        AppButton(
                          label: activeLoan.isRepaymentActive
                              ? 'View loan details'
                              : 'Track application',
                          onPressed: () {
                            final loan = activeLoan!;
                            _open(
                                context, LoanDetailScreen(loanId: loan.loanId));
                          },
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Text(
                      'Smart insights',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(width: 8),
                    const AppNewBadge(),
                  ],
                ),
                const SizedBox(height: 8),
                if (insights.isEmpty)
                  AppCard(
                    child: AppListItem(
                      title: 'No urgent reminders right now',
                      subtitle:
                          'Your recent activity looks steady. Consider adding to savings while you are ahead.',
                      icon: Icons.savings_outlined,
                      badge: 'Helpful tip',
                      onTap: () => _open(context, const TransactionsScreen()),
                    ),
                  )
                else
                  ...insights.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: AppCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: _insightTone(item.priority),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    _insightIcon(item.type),
                                    color: item.priority == 'high'
                                        ? Colors.white
                                        : abayPrimary,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.title,
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleSmall
                                            ?.copyWith(
                                              fontWeight: FontWeight.w700,
                                            ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        item.message,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium
                                            ?.copyWith(
                                              color: abayTextSoft,
                                            ),
                                      ),
                                      if (item.dueAt != null) ...[
                                        const SizedBox(height: 6),
                                        Text(
                                          _formatDueLabel(item),
                                          style: Theme.of(context)
                                              .textTheme
                                              .labelMedium
                                              ?.copyWith(
                                                color: item.priority == 'high'
                                                    ? Colors.red.shade700
                                                    : abayTextSoft,
                                                fontWeight: FontWeight.w600,
                                              ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                AppBadge(
                                  label: _priorityLabel(item.priority),
                                  tone: item.priority == 'high'
                                      ? AppBadgeTone.warning
                                      : AppBadgeTone.neutral,
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            AppButton(
                              label: item.actionLabel,
                              secondary: item.priority != 'high',
                              onPressed: () => _openInsight(context, item),
                            ),
                          ],
                        ),
                      ),
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
      dynamic services, MemberSession session) async {
    final profile = await services.memberApi.fetchMyProfile(session.memberId);
    final results = await Future.wait<dynamic>([
      services.savingsApi.fetchMyAccounts(session.memberId),
      services.loanApi.fetchMyLoans(),
      services.insightApi.fetchMyHomeInsights(),
      services.notificationApi.fetchMyNotifications(),
      session.isShareholder && session.featureFlags.voting
          ? services.votingApi.fetchActiveVotes()
          : Future.value(const <VoteSummary>[]),
    ]);

    return MemberHomeData(
      profile: profile,
      accounts: results[0] as List<SavingsAccount>,
      loans: results[1] as List<LoanSummary>,
      insights: results[2] as SmartInsightFeed,
      notifications: results[3] as List<AppNotification>,
      hasActiveVotingEvent: (results[4] as List<VoteSummary>).isNotEmpty,
    );
  }

  void _maybeShowLiveNotification(List<AppNotification> notifications) {
    if (!mounted || notifications.isEmpty) {
      return;
    }

    AppNotification? latestUnread;
    for (final item in notifications) {
      if (item.status != 'read') {
        latestUnread = item;
        break;
      }
    }

    if (latestUnread == null) {
      _notificationFeedInitialized = true;
      return;
    }

    if (!_notificationFeedInitialized) {
      _notificationFeedInitialized = true;
      _latestForegroundNotificationId = latestUnread.notificationId;
      return;
    }

    if (_latestForegroundNotificationId == latestUnread.notificationId) {
      return;
    }

    final notification = latestUnread;
    _latestForegroundNotificationId = notification.notificationId;

    final isSecurityForegroundAlert = notification.type == 'suspicious_login' ||
        notification.type == 'account_locked' ||
        notification.type == 'account_unlocked' ||
        notification.title.toLowerCase().contains('login detected') ||
        notification.message
            .toLowerCase()
            .contains('new login to your bunna bank mobile profile');

    if (isSecurityForegroundAlert) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      return;
    }

    final actionLabel = notification.type == 'school_payment_due'
        ? 'Open School Pay'
        : (notification.actionLabel ?? 'Open');

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text('${notification.title}: ${notification.message}'),
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: actionLabel,
            onPressed: () => _openNotificationFromHome(notification),
          ),
        ),
      );
  }

  void _openNotificationFromHome(AppNotification notification) {
    if (!mounted) {
      return;
    }

    final deepLink = notification.deepLink ?? '';
    if (deepLink.isNotEmpty) {
      openNotificationDeepLink(Navigator.of(context), deepLink);
      return;
    }

    _open(context, const NotificationsScreen());
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
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
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Ink(
        decoration: BoxDecoration(
          border: Border.all(color: abayBorder),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: abayAccentSoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: abayPrimary),
            ),
            const SizedBox(height: 10),
            Text(label,
                style: Theme.of(context)
                    .textTheme
                    .labelMedium
                    ?.copyWith(fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}

class _LoanMetric extends StatelessWidget {
  const _LoanMetric({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F7FB),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: abayBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: abayTextSoft,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}

class _FeatureHighlight {
  const _FeatureHighlight({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.badge,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String badge;
  final void Function(BuildContext context) onTap;
}

void _open(BuildContext context, Widget screen) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(builder: (_) => screen),
  );
}

void _openInsight(BuildContext context, SmartInsight insight) {
  final route = insight.actionRoute;

  if (route.startsWith('/loans/')) {
    final loanId = route.split('/').last;
    _open(context, LoanDetailScreen(loanId: loanId));
    return;
  }

  if (route.startsWith('/loans')) {
    _open(context, const MyLoansScreen());
    return;
  }

  if (route.startsWith('/payments')) {
    _open(context, const PaymentsScreen());
    return;
  }

  if (route.startsWith('/insurance')) {
    _open(context, const TransactionsScreen());
    return;
  }

  if (route.startsWith('/savings')) {
    _open(context, const TransactionsScreen());
    return;
  }

  _open(context, const NotificationsScreen());
}

String _firstName(String fullName) => fullName.split(' ').first;

String _loanStatusLabel(String value) =>
    value.replaceAll('_', ' ').toUpperCase();

String _nextLoanAction(LoanSummary loan) {
  switch (loan.status) {
    case 'need_documents':
      return 'Upload required documents';
    case 'approved':
      return 'Watch for disbursement';
    case 'disbursed':
      return 'Make the next payment on time';
    default:
      return 'Continue loan review tracking';
  }
}

String _formatLoanDate(DateTime? value) {
  if (value == null) {
    return 'To be scheduled';
  }

  const monthNames = <String>[
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${monthNames[value.month - 1]} ${value.day}, ${value.year}';
}

List<_FeatureHighlight> _buildFeatureHighlights({
  required bool hasActiveLoan,
  required bool isShareholder,
}) {
  final items = <_FeatureHighlight>[
    _FeatureHighlight(
      title: 'KYC and Fayda verification',
      subtitle:
          'Identity onboarding, Fayda review, and verification status are now available in-app.',
      icon: Icons.verified_user_outlined,
      badge: 'NEW',
      onTap: (context) => _open(context, const FaydaVerificationScreen()),
    ),
    _FeatureHighlight(
      title: 'Live chat support',
      subtitle:
          'Talk to the bank directly and follow support replies in one place.',
      icon: Icons.chat_bubble_outline_rounded,
      badge: 'NEW',
      onTap: (context) => _open(context, const LiveChatListScreen()),
    ),
    _FeatureHighlight(
      title: 'School fee management',
      subtitle:
          'Manage recurring school payments with due reminders, history, and optional auto-pay.',
      icon: Icons.school_outlined,
      badge: 'IMPROVED',
      onTap: (context) => _open(context, const SchoolPaymentScreen()),
    ),
    _FeatureHighlight(
      title: 'Auto payments',
      subtitle:
          'Recurring rules now cover school fees, DSTV, rent, utilities, and savings transfers.',
      icon: Icons.autorenew_rounded,
      badge: 'NEW',
      onTap: (context) => _open(context, const AutoPaymentScreen()),
    ),
    _FeatureHighlight(
      title: 'Account lock and security',
      subtitle:
          'Control account lock, device sessions, biometrics, and sensitive verification from one security center.',
      icon: Icons.lock_outline_rounded,
      badge: 'IMPROVED',
      onTap: (context) => _open(context, const SettingsScreen()),
    ),
    _FeatureHighlight(
      title: 'ATM card order',
      subtitle:
          'Request a new ATM card or replacement card directly from the app.',
      icon: Icons.credit_card_outlined,
      badge: 'NEW',
      onTap: (context) => _open(context, const AtmCardOrderScreen()),
    ),
    _FeatureHighlight(
      title: 'Phone number update',
      subtitle:
          'Change your phone number with verification and supporting identity checks.',
      icon: Icons.phone_iphone_outlined,
      badge: 'NEW',
      onTap: (context) => _open(context, const PhoneNumberUpdateScreen()),
    ),
    _FeatureHighlight(
      title: 'Add account member',
      subtitle:
          'Submit nominee, joint-holder, or related-member requests with verification.',
      icon: Icons.group_add_outlined,
      badge: 'NEW',
      onTap: (context) => _open(context, const AccountRelationshipsScreen()),
    ),
    _FeatureHighlight(
      title: 'Smart insights',
      subtitle:
          'Dynamic reminders now highlight school fees, utilities, autopay, and savings guidance.',
      icon: Icons.insights_outlined,
      badge: 'NEW',
      onTap: (context) => _open(context, const NotificationsScreen()),
    ),
    _FeatureHighlight(
      title: 'Shareholder services',
      subtitle: isShareholder
          ? 'Access voting, AGM announcements, shareholder notices, and future dividend or share-performance services in one place.'
          : 'Eligible shareholders can access voting, announcements, and future dividend-focused services from a dedicated workspace.',
      icon: Icons.how_to_vote_outlined,
      badge: 'ROLE-BASED',
      onTap: (context) => _open(
        context,
        ShareholderDashboardScreen(session: AppScope.of(context).session!),
      ),
    ),
  ];

  if (hasActiveLoan) {
    items.insert(
      1,
      _FeatureHighlight(
        title: 'Loan tracker',
        subtitle:
            'Track your application stage, repayment details, and next due date from the app.',
        icon: Icons.account_balance_wallet_outlined,
        badge: 'IMPROVED',
        onTap: (context) => _open(context, const MyLoansScreen()),
      ),
    );
  }

  return items;
}

class MemberHomeData {
  const MemberHomeData({
    required this.profile,
    required this.accounts,
    required this.loans,
    required this.insights,
    required this.notifications,
    required this.hasActiveVotingEvent,
  });

  final MemberProfile profile;
  final List<SavingsAccount> accounts;
  final List<LoanSummary> loans;
  final SmartInsightFeed insights;
  final List<AppNotification> notifications;
  final bool hasActiveVotingEvent;

  String get primaryBalanceLabel {
    if (accounts.isEmpty) {
      return '0';
    }

    return accounts.first.balance.toStringAsFixed(0);
  }
}

Color _insightTone(String priority) {
  switch (priority) {
    case 'high':
      return abayPrimary;
    case 'medium':
      return abayAccentSoft;
    default:
      return const Color(0xFFF4F7FB);
  }
}

IconData _insightIcon(String type) {
  switch (type) {
    case 'school_payment_due':
      return Icons.school_outlined;
    case 'loan_due':
      return Icons.account_balance_wallet_outlined;
    case 'insurance_due':
      return Icons.shield_outlined;
    case 'low_balance_warning':
      return Icons.warning_amber_rounded;
    case 'payment_overdue':
      return Icons.error_outline_rounded;
    case 'utility_due':
      return Icons.bolt_outlined;
    case 'rent_due':
      return Icons.home_outlined;
    case 'subscription_due':
      return Icons.subscriptions_outlined;
    case 'savings_suggestion':
      return Icons.savings_outlined;
    default:
      return Icons.insights_outlined;
  }
}

String _priorityLabel(String priority) {
  switch (priority) {
    case 'high':
      return 'Urgent';
    case 'medium':
      return 'Soon';
    default:
      return 'Tip';
  }
}

String _formatDueLabel(SmartInsight insight) {
  final dueAt = insight.dueAt;
  if (dueAt == null) {
    return 'Review details';
  }

  final now = DateTime.now();
  final difference = dueAt.difference(now).inDays;
  if (difference < 0) {
    return 'Overdue';
  }
  if (difference == 0) {
    return 'Due today';
  }
  if (difference == 1) {
    return 'Due tomorrow';
  }
  return 'Due in $difference days';
}
