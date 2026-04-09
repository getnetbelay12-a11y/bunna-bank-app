import 'dart:async';

import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_input.dart';
import '../../../shared/widgets/app_list_item.dart';

class SchoolPaymentScreen extends StatefulWidget {
  const SchoolPaymentScreen({
    super.key,
    this.initialStudentId,
  });

  final String? initialStudentId;

  @override
  State<SchoolPaymentScreen> createState() => _SchoolPaymentScreenState();
}

class _SchoolPaymentScreenState extends State<SchoolPaymentScreen>
    with WidgetsBindingObserver {
  final _formKey = GlobalKey<FormState>();
  final _studentNameController = TextEditingController(text: 'Mahi Kebede');
  final _studentIdController = TextEditingController(text: 'ST-1001');
  final _schoolNameController =
      TextEditingController(text: 'Blue Nile Academy');
  final _amountController = TextEditingController(text: '1500');
  Timer? _refreshTimer;
  int _selectedProfileIndex = 0;
  int _refreshNonce = 0;
  String? _selectedStudentId;
  bool _submitting = false;
  String? _message;
  Future<void>? _restoreSessionFuture;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _selectedStudentId = widget.initialStudentId;
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _refreshProfiles();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _refreshTimer?.cancel();
    _studentNameController.dispose();
    _studentIdController.dispose();
    _schoolNameController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refreshProfiles();
    }
  }

  void _refreshProfiles() {
    if (!mounted) {
      return;
    }

    setState(() {
      _refreshNonce++;
    });
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final controller = AppScope.of(context);
    final session = controller.session;

    if (session == null) {
      _restoreSessionFuture ??= controller.restoreSession();

      return FutureBuilder<void>(
        future: _restoreSessionFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const AppScaffold(
              title: 'School Payment',
              showBack: true,
              body: Center(child: CircularProgressIndicator()),
            );
          }

          if (controller.session != null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) {
                return;
              }
              setState(() {
                _restoreSessionFuture = null;
              });
            });
            return const SizedBox.shrink();
          }

          return const Scaffold(
            body: SafeArea(
              child: Center(
                child: Text('Please sign in to use school payment.'),
              ),
            ),
          );
        },
      );
    }

    return FutureBuilder<List<dynamic>>(
      future: Future.wait<dynamic>([
        Future<int>.value(_refreshNonce),
        services.savingsApi.fetchMyAccounts(session.memberId),
        services.schoolPaymentApi.fetchMyLinkedStudents(),
        services.schoolPaymentApi.fetchMySchoolPayments(),
        services.autopayApi.fetchInstructions(),
      ]),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const AppScaffold(
            title: 'School Payment',
            showBack: true,
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasError) {
          return AppScaffold(
            title: 'School Payment',
            showBack: true,
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  _friendlyError(
                    snapshot.error ?? Exception('Unknown error'),
                    fallback: 'Unable to load school payment profiles.',
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          );
        }

        final accounts = snapshot.data?[1] as List<SavingsAccount>? ??
            const <SavingsAccount>[];
        final linkedStudents =
            snapshot.data?[2] as List<Map<String, dynamic>>? ??
                const <Map<String, dynamic>>[];
        final payments = snapshot.data?[3] as List<dynamic>? ?? const [];
        final autopays = snapshot.data?[4] as List<AutopayInstruction>? ??
            const <AutopayInstruction>[];
        final profiles = _buildProfiles(linkedStudents, payments, autopays);
        final selectedProfileIndex = _resolveSelectedProfileIndex(profiles);
        final selectedProfile =
            profiles.isEmpty ? null : profiles[selectedProfileIndex];
        final primaryAccount = accounts.isNotEmpty ? accounts.first : null;

        return AppScaffold(
          title: 'School Payment',
          showBack: true,
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const AppHeader(
                title: 'School Payment',
                subtitle:
                    'Manage monthly tuition with due reminders, payment history, and optional auto pay.',
              ),
              if (selectedProfile != null) ...[
                const SizedBox(height: 16),
                AppCard(
                  child: AppListItem(
                    title: selectedProfile.status == 'overdue'
                        ? 'School fee overdue'
                        : 'Next school fee reminder',
                    subtitle:
                        '${selectedProfile.schoolName} • Due ${selectedProfile.dueDateLabel}',
                    icon: selectedProfile.status == 'overdue'
                        ? Icons.warning_amber_rounded
                        : Icons.school_outlined,
                    badge: selectedProfile.statusLabel,
                    badgeTone: selectedProfile.status == 'overdue'
                        ? AppBadgeTone.warning
                        : AppBadgeTone.success,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Student Profiles',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    if (profiles.isEmpty)
                      Text(
                        'No student profiles yet. Add one below to start monthly school payments.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      )
                    else
                      for (var index = 0; index < profiles.length; index++) ...[
                        AppListItem(
                          title: profiles[index].studentName,
                          subtitle:
                              '${profiles[index].schoolName} · Due ${profiles[index].dueDateLabel} · ${profiles[index].statusLabel}',
                          icon: Icons.school_outlined,
                          badge:
                              'ETB ${profiles[index].monthlyFee.toStringAsFixed(0)}',
                          badgeTone: profiles[index].status == 'overdue'
                              ? AppBadgeTone.warning
                              : AppBadgeTone.neutral,
                          onTap: () async {
                            setState(() {
                              _selectedProfileIndex = index;
                              _selectedStudentId = profiles[index].studentId;
                            });
                            await Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => _StudentProfileDetailScreen(
                                  profile: profiles[index],
                                  fundingAccountNumber:
                                      primaryAccount?.accountNumber,
                                ),
                              ),
                            );
                          },
                        ),
                        if (index != profiles.length - 1)
                          const Divider(height: 1),
                      ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (selectedProfile != null)
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              selectedProfile.studentName,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                          AppBadge(
                            label: selectedProfile.statusLabel,
                            tone: selectedProfile.status == 'overdue'
                                ? AppBadgeTone.warning
                                : AppBadgeTone.success,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          AppBadge(
                            label: selectedProfile.autoPayEnabled
                                ? 'AUTOPAY ON'
                                : 'MANUAL PAY',
                            tone: selectedProfile.autoPayEnabled
                                ? AppBadgeTone.primary
                                : AppBadgeTone.neutral,
                          ),
                          AppBadge(
                            label:
                                'DUE ${selectedProfile.dueDateLabel.toUpperCase()}',
                            tone: selectedProfile.status == 'overdue'
                                ? AppBadgeTone.warning
                                : AppBadgeTone.neutral,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('School: ${selectedProfile.schoolName}'),
                      const SizedBox(height: 4),
                      Text('Grade: ${selectedProfile.gradeLabel}'),
                      const SizedBox(height: 4),
                      Text(
                          'Performance: ${selectedProfile.latestAverageLabel}'),
                      const SizedBox(height: 4),
                      Text(
                        selectedProfile.outstandingBalance > 0
                            ? 'Amount due: ETB ${selectedProfile.outstandingBalance.toStringAsFixed(0)}'
                            : 'Monthly fee: ETB ${selectedProfile.monthlyFee.toStringAsFixed(0)}',
                      ),
                      const SizedBox(height: 4),
                      Text('Due date: ${selectedProfile.dueDateLabel}'),
                      const SizedBox(height: 4),
                      Text(
                          'Funding account: ${primaryAccount?.accountNumber ?? 'Not linked'}'),
                      const SizedBox(height: 8),
                      Text(
                        selectedProfile.parentUpdateSummary,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 14),
                      SwitchListTile.adaptive(
                        value: selectedProfile.autoPayEnabled,
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Auto Pay'),
                        subtitle: Text(
                          selectedProfile.autoPayEnabled
                              ? 'Monthly fee will be attempted automatically on the due date.'
                              : 'Enable automatic payment for this student profile.',
                        ),
                        onChanged: primaryAccount == null
                            ? null
                            : (_) => _toggleAutopay(
                                  services,
                                  selectedProfile,
                                  primaryAccount,
                                ),
                      ),
                      const SizedBox(height: 8),
                      AppButton(
                        label: selectedProfile.isPaid
                            ? 'Paid'
                            : _submitting
                                ? 'Processing...'
                                : 'Pay Now',
                        onPressed: selectedProfile.isPaid ||
                                _submitting ||
                                primaryAccount == null
                            ? null
                            : () => _submitPayment(
                                  services,
                                  primaryAccount,
                                  selectedProfile,
                                ),
                      ),
                      if (_message != null) ...[
                        const SizedBox(height: 12),
                        Text(_message!),
                      ],
                    ],
                  ),
                ),
              if (selectedProfile != null) ...[
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Payment History',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      for (var index = 0;
                          index < selectedProfile.history.length;
                          index++) ...[
                        AppListItem(
                          title: selectedProfile.history[index].monthLabel,
                          subtitle: selectedProfile.history[index].statusLabel,
                          icon: Icons.receipt_long_outlined,
                          badge:
                              'ETB ${selectedProfile.history[index].amount.toStringAsFixed(0)}',
                          badgeTone:
                              selectedProfile.history[index].status == 'paid'
                                  ? AppBadgeTone.success
                                  : AppBadgeTone.warning,
                        ),
                        if (index != selectedProfile.history.length - 1)
                          const Divider(height: 1),
                      ],
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              AppCard(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Add or Update Student',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 12),
                      AppInput(
                        controller: _studentNameController,
                        label: 'Student Name',
                        validator: (value) =>
                            (value == null || value.trim().isEmpty)
                                ? 'Student name is required.'
                                : null,
                      ),
                      const SizedBox(height: 12),
                      AppInput(
                        controller: _studentIdController,
                        label: 'Student ID',
                        validator: (value) =>
                            (value == null || value.trim().isEmpty)
                                ? 'Student ID is required.'
                                : null,
                      ),
                      const SizedBox(height: 12),
                      AppInput(
                        controller: _schoolNameController,
                        label: 'School Name',
                        validator: (value) =>
                            (value == null || value.trim().isEmpty)
                                ? 'School name is required.'
                                : null,
                      ),
                      const SizedBox(height: 12),
                      AppInput(
                        controller: _amountController,
                        label: 'Monthly Amount',
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        validator: (value) {
                          final amount = double.tryParse(value ?? '');
                          if (amount == null || amount <= 0) {
                            return 'Enter a valid monthly amount.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Profiles are modeled here as recurring monthly school-payment plans with due date tracking and optional autopay.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _submitPayment(
    dynamic services,
    SavingsAccount account,
    _StudentProfile profile,
  ) async {
    if (_submitting) {
      return;
    }
    setState(() {
      _submitting = true;
      _message = null;
    });

    try {
      final result = await services.schoolPaymentApi.createSchoolPayment(
        accountId: account.accountId,
        studentId: profile.studentId,
        schoolName: profile.schoolName,
        amount: profile.outstandingBalance > 0
            ? profile.outstandingBalance
            : profile.monthlyFee,
        channel: 'mobile',
        narration: 'Monthly school payment',
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _submitting = false;
        _message = 'Payment recorded: ${result.transactionReference}';
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _submitting = false;
        _message =
            _friendlyError(error, fallback: 'Unable to submit school payment.');
      });
    }
  }

  Future<void> _toggleAutopay(
    dynamic services,
    _StudentProfile profile,
    SavingsAccount account,
  ) async {
    setState(() {
      _message = null;
    });
    try {
      if (profile.autoPayId == null) {
        await services.autopayApi.createInstruction(
          provider: 'school_payment',
          accountId: account.accountId,
          schedule: 'monthly',
        );
      } else {
        await services.autopayApi.updateInstructionStatus(
          id: profile.autoPayId,
          provider: 'school_payment',
          enabled: !profile.autoPayEnabled,
        );
      }
      if (!mounted) {
        return;
      }
      setState(() {
        _message = profile.autoPayEnabled
            ? 'School payment AutoPay disabled.'
            : 'School payment AutoPay enabled.';
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _message = _friendlyError(error,
            fallback: 'Unable to update school payment AutoPay.');
      });
    }
  }

  List<_StudentProfile> _buildProfiles(
    List<Map<String, dynamic>> linkedStudents,
    List<dynamic> payments,
    List<AutopayInstruction> autopays,
  ) {
    final schoolAutopay = autopays.firstWhere(
      (item) => item.serviceType == 'school_payment',
      orElse: () => const AutopayInstruction(
        id: '',
        serviceType: 'school_payment',
        accountId: '',
        schedule: 'monthly',
        enabled: false,
      ),
    );

    return linkedStudents.asMap().entries.map((entry) {
      final index = entry.key;
      final student = entry.value;
      final studentPayments = payments
          .where((payment) =>
              '${payment['studentId'] ?? ''}' ==
              '${student['studentId'] ?? ''}')
          .map(
            (payment) => _PaymentHistoryItem(
              monthLabel: _historyLabel(
                DateTime.tryParse('${payment['createdAt']}') ?? DateTime.now(),
              ),
              amount: (payment['amount'] as num?)?.toDouble() ?? 0,
              status: '${payment['status'] ?? 'pending'}',
            ),
          )
          .toList();
      final latestPayment =
          studentPayments.isNotEmpty ? studentPayments.first : null;
      final paymentSummary =
          student['paymentSummary'] as Map<String, dynamic>? ?? const {};
      final performanceSummary =
          student['performanceSummary'] as Map<String, dynamic>? ?? const {};
      final monthlyFee = latestPayment?.amount ??
          (paymentSummary['monthlyFee'] as num?)?.toDouble() ??
          double.tryParse(_amountController.text) ??
          1500;
      final rawStatus = '${student['status'] ?? 'active'}';
      final outstandingBalance =
          (paymentSummary['outstandingBalance'] as num?)?.toDouble() ?? 0;
      final paymentStatus = '${paymentSummary['paymentStatus'] ?? ''}';
      final latestAverage = performanceSummary['latestAverage'];
      final nextDueDate = paymentSummary['nextDueDate']?.toString();
      final nextPaymentAmount =
          (paymentSummary['monthlyFee'] as num?)?.toDouble() ?? monthlyFee;

      return _StudentProfile(
        studentName: '${student['fullName'] ?? 'Student'}',
        studentId: '${student['studentId'] ?? ''}',
        schoolName:
            '${student['schoolName'] ?? student['schoolId'] ?? 'School'}',
        gradeLabel: '${student['grade'] ?? 'Unassigned'}',
        monthlyFee: monthlyFee,
        outstandingBalance: outstandingBalance,
        dueDay: 5 + index,
        autoPayEnabled: schoolAutopay.enabled,
        autoPayId: schoolAutopay.id.isEmpty ? null : schoolAutopay.id,
        status: paymentStatus.isNotEmpty
            ? _profileStatusForSummary(paymentStatus, outstandingBalance)
            : latestPayment == null
                ? (rawStatus == 'pending_billing' ? 'overdue' : 'due')
                : _profileStatusForPayment(latestPayment.status),
        parentUpdateSummary:
            '${student['parentUpdateSummary'] ?? 'No academic update published yet.'}',
        latestAverageLabel: latestAverage is num
            ? '${latestAverage.toStringAsFixed(0)}% average'
            : '${student['grade'] ?? 'Current grade'} · awaiting report',
        nextPaymentDateLabel: _formatNextPaymentDate(nextDueDate, 5 + index),
        nextPaymentAmount: nextPaymentAmount,
        history: studentPayments.isEmpty
            ? [
                _PaymentHistoryItem(
                  monthLabel: _historyLabel(DateTime.now()),
                  amount: monthlyFee,
                  status:
                      rawStatus == 'pending_billing' ? 'overdue' : 'pending',
                ),
              ]
            : studentPayments,
      );
    }).toList();
  }

  int _resolveSelectedProfileIndex(List<_StudentProfile> profiles) {
    if (profiles.isEmpty) {
      return 0;
    }

    final preferredStudentId =
        (_selectedStudentId ?? widget.initialStudentId)?.trim();
    if (preferredStudentId == null || preferredStudentId.isEmpty) {
      _selectedStudentId =
          profiles[_selectedProfileIndex.clamp(0, profiles.length - 1)]
              .studentId;
      return _selectedProfileIndex.clamp(0, profiles.length - 1);
    }

    final preferredIndex = profiles.indexWhere(
      (profile) => profile.studentId == preferredStudentId,
    );
    if (preferredIndex >= 0) {
      _selectedProfileIndex = preferredIndex;
      _selectedStudentId = profiles[preferredIndex].studentId;
      return preferredIndex;
    }

    _selectedProfileIndex = 0;
    _selectedStudentId = profiles.first.studentId;
    return 0;
  }

  String _profileStatusForSummary(
      String paymentStatus, double outstandingBalance) {
    switch (paymentStatus) {
      case 'paid':
        return 'upcoming';
      case 'partially_paid':
        return outstandingBalance <= 0 ? 'upcoming' : 'due';
      case 'unpaid':
      case 'pending_billing':
        return 'overdue';
      default:
        return 'due';
    }
  }

  String _profileStatusForPayment(String paymentStatus) {
    switch (paymentStatus) {
      case 'successful':
      case 'paid':
        return 'upcoming';
      case 'overdue':
      case 'failed':
        return 'overdue';
      default:
        return 'due';
    }
  }

  String _historyLabel(DateTime date) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return '${months[date.month - 1]} ${date.year}';
  }

  String _formatNextPaymentDate(String? rawDate, int dueDay) {
    final parsed = rawDate == null || rawDate.isEmpty
        ? null
        : DateTime.tryParse(rawDate);
    if (parsed == null) {
      return 'Day $dueDay each month';
    }

    const months = [
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
    return '${months[parsed.month - 1]} ${parsed.day}, ${parsed.year}';
  }

  String _friendlyError(Object error, {required String fallback}) {
    final text = error.toString();
    final trimmed = text.startsWith('Exception: ')
        ? text.substring('Exception: '.length)
        : text;
    return trimmed.isEmpty ? fallback : trimmed;
  }
}

class _StudentProfile {
  const _StudentProfile({
    required this.studentName,
    required this.studentId,
    required this.schoolName,
    required this.gradeLabel,
    required this.monthlyFee,
    required this.outstandingBalance,
    required this.dueDay,
    required this.autoPayEnabled,
    required this.autoPayId,
    required this.status,
    required this.parentUpdateSummary,
    required this.latestAverageLabel,
    this.nextPaymentDateLabel,
    this.nextPaymentAmount,
    required this.history,
  });

  final String studentName;
  final String studentId;
  final String schoolName;
  final String gradeLabel;
  final double monthlyFee;
  final double outstandingBalance;
  final int dueDay;
  final bool autoPayEnabled;
  final String? autoPayId;
  final String status;
  final String parentUpdateSummary;
  final String latestAverageLabel;
  final String? nextPaymentDateLabel;
  final double? nextPaymentAmount;
  final List<_PaymentHistoryItem> history;

  String get dueDateLabel => 'Day $dueDay each month';

  bool get isPaid => outstandingBalance <= 0 && status == 'upcoming';

  String get statusLabel {
    switch (status) {
      case 'overdue':
        return 'Overdue';
      case 'due':
        return 'Due Soon';
      case 'upcoming':
        return 'Upcoming';
      default:
        return 'Active';
    }
  }
}

class _PaymentHistoryItem {
  const _PaymentHistoryItem({
    required this.monthLabel,
    required this.amount,
    required this.status,
  });

  final String monthLabel;
  final double amount;
  final String status;

  String get statusLabel => status.replaceAll('_', ' ').toUpperCase();
}

class _StudentProfileDetailScreen extends StatelessWidget {
  const _StudentProfileDetailScreen({
    required this.profile,
    required this.fundingAccountNumber,
  });

  final _StudentProfile profile;
  final String? fundingAccountNumber;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Student Profile',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AppHeader(
            title: profile.studentName,
            subtitle: '${profile.schoolName} · ${profile.studentId}',
            trailing: AppBadge(
              label: profile.statusLabel,
              tone: profile.status == 'overdue'
                  ? AppBadgeTone.warning
                  : AppBadgeTone.success,
            ),
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    AppBadge(
                      label: profile.autoPayEnabled ? 'AUTOPAY ON' : 'MANUAL PAY',
                      tone: profile.autoPayEnabled
                          ? AppBadgeTone.primary
                          : AppBadgeTone.neutral,
                    ),
                    AppBadge(
                      label: 'DUE ${profile.dueDateLabel.toUpperCase()}',
                      tone: profile.status == 'overdue'
                          ? AppBadgeTone.warning
                          : AppBadgeTone.neutral,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _ProfileDetailRow(label: 'School', value: profile.schoolName),
                _ProfileDetailRow(label: 'Grade', value: profile.gradeLabel),
                _ProfileDetailRow(
                  label: 'Performance',
                  value: profile.latestAverageLabel,
                ),
                _ProfileDetailRow(
                  label: profile.outstandingBalance > 0
                      ? 'Amount due'
                      : 'Monthly fee',
                  value:
                      'ETB ${(profile.outstandingBalance > 0 ? profile.outstandingBalance : profile.monthlyFee).toStringAsFixed(0)}',
                ),
                _ProfileDetailRow(
                  label: 'Next payment date',
                  value: profile.nextPaymentDateLabel ?? profile.dueDateLabel,
                ),
                _ProfileDetailRow(
                  label: 'Next payment amount',
                  value:
                      'ETB ${(profile.nextPaymentAmount ?? profile.monthlyFee).toStringAsFixed(0)}',
                ),
                _ProfileDetailRow(
                  label: 'Funding account',
                  value: fundingAccountNumber ?? 'Not linked',
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Parent Update',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                Text(
                  profile.parentUpdateSummary,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Payment History',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                for (var index = 0; index < profile.history.length; index++) ...[
                  AppListItem(
                    title: profile.history[index].monthLabel,
                    subtitle: profile.history[index].statusLabel,
                    icon: Icons.receipt_long_outlined,
                    badge:
                        'ETB ${profile.history[index].amount.toStringAsFixed(0)}',
                    badgeTone: profile.history[index].status == 'paid'
                        ? AppBadgeTone.success
                        : AppBadgeTone.warning,
                  ),
                  if (index != profile.history.length - 1)
                    const Divider(height: 1),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileDetailRow extends StatelessWidget {
  const _ProfileDetailRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF6D8299),
                  ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
