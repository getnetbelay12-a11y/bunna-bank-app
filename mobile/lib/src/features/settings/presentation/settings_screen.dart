import 'dart:io' show Platform;

import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  Future<SecurityOverview>? _overviewFuture;
  bool _savingLock = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _overviewFuture ??= _loadOverview();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final biometricLabel = Platform.isIOS ? 'Face ID Login' : 'Biometric Login';

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Security Center'),
      ),
      body: SafeArea(
        child: FutureBuilder<SecurityOverview>(
          future: _overviewFuture,
          builder: (context, snapshot) {
            final overview = snapshot.data;
            return RefreshIndicator(
              onRefresh: () async {
                final next = _loadOverview();
                setState(() {
                  _overviewFuture = next;
                });
                await next;
              },
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text(
                    'Protect access, review trusted devices, and control high-risk banking actions from one place.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: abayTextSoft,
                        ),
                  ),
                  const SizedBox(height: 20),
                  _SummaryCard(
                    title: 'Security posture',
                    items: [
                      _SummaryItem(
                        label: 'Account lock',
                        value: overview?.accountLockEnabled == true
                            ? 'Enabled'
                            : 'Disabled',
                      ),
                      _SummaryItem(
                        label: 'Current sessions',
                        value: '${overview?.sessions.length ?? 0}',
                      ),
                      _SummaryItem(
                        label: 'Trusted devices',
                        value: '${overview?.devices.length ?? 0}',
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: SwitchListTile(
                      value: overview?.accountLockEnabled ?? false,
                      title: const Text('Account Lock'),
                      subtitle: Text(
                        _savingLock
                            ? 'Saving security preference...'
                            : 'Block high-risk actions until the account is explicitly unlocked again.',
                      ),
                      onChanged: _savingLock || overview == null
                          ? null
                          : (value) => _updateAccountLock(value),
                    ),
                  ),
                  Card(
                    child: SwitchListTile(
                      value: controller.biometricEnabled,
                      title: Text(biometricLabel),
                      subtitle: Text(
                        Platform.isIOS
                            ? 'Use Face ID for faster, secure sign in on this device.'
                            : 'Use biometric authentication for faster, secure sign in.',
                      ),
                      onChanged: controller.toggleBiometric,
                    ),
                  ),
                  Card(
                    child: SwitchListTile(
                      value: controller.pinEnabled,
                      title: const Text('PIN Login'),
                      subtitle: const Text(
                        'Keep PIN sign in enabled for daily banking access.',
                      ),
                      onChanged: controller.togglePin,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'High-Risk Action Verification',
                    child: Text(
                      overview?.highRiskActionVerification == true
                          ? 'Enabled for payments, governance voting, card controls, and sensitive profile changes.'
                          : 'High-risk action verification is unavailable right now.',
                    ),
                  ),
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'Active Sessions',
                    child: overview == null
                        ? const _LoadingBlock()
                        : Column(
                            children: [
                              for (final session in overview.sessions) ...[
                                _SessionTile(
                                  session: session,
                                  onRevoke: session.isCurrent
                                      ? null
                                      : () => _revokeSession(session.challengeId),
                                ),
                                if (session != overview.sessions.last)
                                  const SizedBox(height: 12),
                              ],
                              if (overview.sessions.isEmpty)
                                const Text(
                                  'No session history is available yet.',
                                ),
                            ],
                          ),
                  ),
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'Trusted Devices',
                    child: overview == null
                        ? const _LoadingBlock()
                        : Column(
                            children: [
                              for (final device in overview.devices) ...[
                                _DeviceTile(device: device),
                                if (device != overview.devices.last)
                                  const SizedBox(height: 12),
                              ],
                              if (overview.devices.isEmpty)
                                const Text(
                                  'No trusted devices are registered yet.',
                                ),
                            ],
                          ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Future<SecurityOverview> _loadOverview() {
    return AppScope.of(context).services.securityApi.fetchOverview();
  }

  Future<void> _updateAccountLock(bool enabled) async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _savingLock = true;
    });
    try {
      final updated =
          await AppScope.of(context).services.securityApi.updateAccountLock(enabled);
      if (!mounted) {
        return;
      }
      setState(() {
        _savingLock = false;
        _overviewFuture = Future<SecurityOverview>.value(
          SecurityOverview(
            accountLockEnabled: updated,
            highRiskActionVerification: true,
            sessions: const [],
            devices: const [],
          ),
        );
        _overviewFuture = _loadOverview();
      });
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            updated
                ? 'Account lock enabled. High-risk actions are now protected.'
                : 'Account lock disabled. High-risk actions are available again.',
          ),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _savingLock = false;
      });
      messenger.showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  Future<void> _revokeSession(String challengeId) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await AppScope.of(context).services.securityApi.revokeSession(challengeId);
      if (!mounted) {
        return;
      }
      setState(() {
        _overviewFuture = _loadOverview();
      });
      messenger.showSnackBar(
        const SnackBar(content: Text('Session revoked successfully.')),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      messenger.showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.title,
    required this.items,
  });

  final String title;
  final List<_SummaryItem> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: abayPrimary,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              for (final item in items)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.label,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.value,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SummaryItem {
  const _SummaryItem({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: abayBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _SessionTile extends StatelessWidget {
  const _SessionTile({
    required this.session,
    required this.onRevoke,
  });

  final MemberAuthSession session;
  final VoidCallback? onRevoke;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: abaySurfaceAlt,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  session.deviceId ?? session.loginIdentifier,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: session.isCurrent
                      ? abaySuccess.withValues(alpha: 0.12)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  session.isCurrent ? 'Current' : session.status.toUpperCase(),
                  style: TextStyle(
                    color: session.isCurrent ? abaySuccess : abayPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('Login ID: ${session.loginIdentifier}'),
          if (session.updatedAt != null)
            Text('Last activity: ${_formatDateTime(session.updatedAt!)}'),
          if (onRevoke != null) ...[
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: onRevoke,
              child: const Text('Sign Out Session'),
            ),
          ],
        ],
      ),
    );
  }
}

class _DeviceTile extends StatelessWidget {
  const _DeviceTile({required this.device});

  final MemberDevice device;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: abaySurfaceAlt,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  device.deviceId,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              if (device.isCurrent)
                const Chip(label: Text('Current device')),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Remembered: ${device.rememberDevice ? 'Yes' : 'No'} • Biometric: ${device.biometricEnabled ? 'On' : 'Off'}',
          ),
          if (device.lastLoginAt != null)
            Text('Last login: ${_formatDateTime(device.lastLoginAt!)}'),
        ],
      ),
    );
  }
}

class _LoadingBlock extends StatelessWidget {
  const _LoadingBlock();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 24),
      child: Center(child: CircularProgressIndicator()),
    );
  }
}

String _formatDateTime(DateTime value) {
  final month = value.month.toString().padLeft(2, '0');
  final day = value.day.toString().padLeft(2, '0');
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '${value.year}-$month-$day $hour:$minute';
}
