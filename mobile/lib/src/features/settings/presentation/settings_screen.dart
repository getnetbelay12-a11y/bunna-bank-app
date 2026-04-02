import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../../app/app_scope.dart';
import '../../../core/services/api_config.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _accountLockEnabled = false;
  bool _loading = true;
  bool _saving = false;
  String? _message;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_loading) {
      _loadAccountLock();
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Security Settings'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Manage app access, account lock, biometric sign in, and secure session preferences.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: const Color(0xFF64748B),
                  ),
            ),
            const SizedBox(height: 20),
            if (_message != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5FF),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFB9DBFF)),
                ),
                child: Text(_message!),
              ),
              const SizedBox(height: 16),
            ],
            Card(
              child: SwitchListTile(
                value: _accountLockEnabled,
                title: const Text('Account Lock'),
                subtitle: Text(
                  _loading
                      ? 'Loading account lock setting...'
                      : _saving
                          ? 'Saving account lock setting...'
                          : 'Require secure re-entry before sensitive account access.',
                ),
                onChanged: (_loading || _saving)
                    ? null
                    : (value) => _updateAccountLock(value),
              ),
            ),
            Card(
              child: SwitchListTile(
                value: controller.biometricEnabled,
                title: const Text('Biometric Login'),
                subtitle: const Text(
                  'Use fingerprint or face authentication when available.',
                ),
                onChanged: controller.toggleBiometric,
              ),
            ),
            Card(
              child: SwitchListTile(
                value: controller.pinEnabled,
                title: const Text('PIN Authentication'),
                subtitle: const Text(
                  'Keep PIN sign in enabled for daily secure access.',
                ),
                onChanged: controller.togglePin,
              ),
            ),
            const Card(
              child: ListTile(
                leading: Icon(Icons.timer_outlined),
                title: Text('Session Timeout'),
                subtitle: Text(
                  'Sessions expire automatically after inactivity for security.',
                ),
              ),
            ),
            const Card(
              child: ListTile(
                leading: Icon(Icons.notifications_active_outlined),
                title: Text('Notification Preferences'),
                subtitle: Text(
                  'Loan, KYC, insurance, and support alerts remain enabled.',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _loadAccountLock() async {
    if (!ApiConfig.hasBaseUrl) {
      setState(() {
        _loading = false;
        _message = 'API_BASE_URL is not configured. Security settings are local only.';
      });
      return;
    }

    final token = AppScope.of(context).services.sessionStore.accessToken;
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/security/account-lock'),
      headers: _authHeaders(token),
    );

    if (!mounted) {
      return;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      setState(() {
        _accountLockEnabled = data['accountLockEnabled'] as bool? ?? false;
        _loading = false;
      });
      return;
    }

    setState(() {
      _loading = false;
      _message = _extractErrorMessage(
        response.body,
        fallback: 'Unable to load security settings.',
      );
    });
  }

  Future<void> _updateAccountLock(bool enabled) async {
    if (!ApiConfig.hasBaseUrl) {
      setState(() {
        _accountLockEnabled = enabled;
        _message = 'API_BASE_URL is not configured. Security settings are local only.';
      });
      return;
    }

    final token = AppScope.of(context).services.sessionStore.accessToken;
    setState(() {
      _saving = true;
      _accountLockEnabled = enabled;
      _message = null;
    });

    final response = await http.patch(
      Uri.parse('${ApiConfig.baseUrl}/security/account-lock'),
      headers: _authHeaders(token),
      body: jsonEncode({'enabled': enabled}),
    );

    if (!mounted) {
      return;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      setState(() {
        _saving = false;
        _message = enabled
            ? 'Account lock enabled successfully.'
            : 'Account lock disabled successfully.';
      });
      return;
    }

    setState(() {
      _saving = false;
      _accountLockEnabled = !enabled;
      _message = _extractErrorMessage(
        response.body,
        fallback: 'Unable to update account lock.',
      );
    });
  }

  Map<String, String> _authHeaders(String? token) {
    return {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  String _extractErrorMessage(String body, {required String fallback}) {
    try {
      final data = jsonDecode(body);
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.trim().isNotEmpty) {
          return message;
        }
      }
    } catch (_) {
      // Ignore.
    }
    return fallback;
  }
}
