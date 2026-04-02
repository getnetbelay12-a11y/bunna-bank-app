import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../../app/app_scope.dart';
import '../../../core/services/api_config.dart';

class AutoPaymentScreen extends StatefulWidget {
  const AutoPaymentScreen({super.key});

  @override
  State<AutoPaymentScreen> createState() => _AutoPaymentScreenState();
}

class _AutoPaymentScreenState extends State<AutoPaymentScreen> {
  final _items = <_AutopayItem>[
    _AutopayItem(
      id: 'water',
      title: 'Water',
      subtitle: 'Monthly schedule • Debit from primary account',
      schedule: 'monthly',
      accountId: 'primary_account',
    ),
    _AutopayItem(
      id: 'electricity',
      title: 'Electricity',
      subtitle: 'Monthly schedule • Debit from primary account',
      schedule: 'monthly',
      accountId: 'primary_account',
    ),
    _AutopayItem(
      id: 'school_payment',
      title: 'School Payment',
      subtitle: 'Monthly schedule • Debit from primary account',
      schedule: 'monthly',
      accountId: 'primary_account',
    ),
    _AutopayItem(
      id: 'dstv',
      title: 'DSTV',
      subtitle: 'Monthly subscription • Debit from primary account',
      schedule: 'monthly',
      accountId: 'primary_account',
    ),
    _AutopayItem(
      id: 'rent',
      title: 'Rent',
      subtitle: 'Monthly schedule • Debit from primary account',
      schedule: 'monthly',
      accountId: 'primary_account',
    ),
    _AutopayItem(
      id: 'employee_salary',
      title: 'Employee Salary',
      subtitle: 'Payroll schedule • Debit from business account',
      schedule: 'payroll',
      accountId: 'business_account',
    ),
    _AutopayItem(
      id: 'transfer_to_savings',
      title: 'Transfer to Savings',
      subtitle: 'Scheduled transfer • Credit linked savings account',
      schedule: 'weekly',
      accountId: 'savings_account',
    ),
  ];

  bool _loading = true;
  String? _message;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_loading) {
      _loadAutopay();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Auto Payment'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Enable or disable recurring payments for daily banking and small business use cases.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: const Color(0xFF64748B),
                  ),
            ),
            const SizedBox(height: 16),
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
            if (_loading)
              const Center(child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              )),
            for (final item in _items)
              Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 6,
                  ),
                  title: Text(item.title),
                  subtitle: Text(
                    item.saving
                        ? '${item.subtitle}\nSaving...'
                        : item.subtitle,
                  ),
                  trailing: Switch(
                    value: item.enabled,
                    onChanged: item.saving
                        ? null
                        : (value) => _toggleItem(item, value),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _loadAutopay() async {
    if (!ApiConfig.hasBaseUrl) {
      setState(() {
        _loading = false;
      });
      return;
    }

    final controller = AppScope.of(context);
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/autopay/list'),
      headers: _authHeaders(controller.services.sessionStore.accessToken),
    );

    if (!mounted) {
      return;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final items = (data['items'] as List<dynamic>? ?? const [])
          .cast<Map<String, dynamic>>();
      final byProvider = {
        for (final item in items)
          (item['provider'] as String? ?? item['serviceType'] as String? ?? ''): item,
      };

      for (final item in _items) {
        final saved = byProvider[item.id];
        if (saved == null) {
          continue;
        }
        item.recordId = saved['id'] as String?;
        item.enabled = saved['enabled'] as bool? ?? false;
      }
    } else {
      _message = _extractErrorMessage(
        response.body,
        fallback: 'Unable to load auto payment settings.',
      );
    }

    setState(() {
      _loading = false;
    });
  }

  Future<void> _toggleItem(_AutopayItem item, bool value) async {
    if (!ApiConfig.hasBaseUrl) {
      setState(() {
        item.enabled = value;
        _message = 'API_BASE_URL is not configured. Changes are local only.';
      });
      return;
    }

    final controller = AppScope.of(context);
    setState(() {
      item.saving = true;
      item.enabled = value;
      _message = null;
    });

    try {
      if (value && item.recordId == null) {
        final createResponse = await http.post(
          Uri.parse('${ApiConfig.baseUrl}/autopay/create'),
          headers: _authHeaders(controller.services.sessionStore.accessToken),
          body: jsonEncode({
            'provider': item.id,
            'accountId': item.accountId,
            'schedule': item.schedule,
          }),
        );

        if (createResponse.statusCode < 200 || createResponse.statusCode >= 300) {
          throw Exception(_extractErrorMessage(
            createResponse.body,
            fallback: 'Unable to save auto payment.',
          ));
        }

        final created = jsonDecode(createResponse.body) as Map<String, dynamic>;
        item.recordId =
            (created['item'] as Map<String, dynamic>?)?['id'] as String?;
      } else if (item.recordId != null) {
        final updateResponse = await http.patch(
          Uri.parse('${ApiConfig.baseUrl}/autopay/status'),
          headers: _authHeaders(controller.services.sessionStore.accessToken),
          body: jsonEncode({
            'id': item.recordId,
            'provider': item.id,
            'enabled': value,
          }),
        );

        if (updateResponse.statusCode < 200 || updateResponse.statusCode >= 300) {
          throw Exception(_extractErrorMessage(
            updateResponse.body,
            fallback: 'Unable to update auto payment.',
          ));
        }
      }

      if (!mounted) {
        return;
      }
      setState(() {
        item.saving = false;
        _message = '${item.title} updated successfully.';
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        item.saving = false;
        item.enabled = !value;
        _message = error.toString().replaceFirst('Exception: ', '');
      });
    }
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

class _AutopayItem {
  _AutopayItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.schedule,
    required this.accountId,
  });

  final String id;
  final String title;
  final String subtitle;
  final String schedule;
  final String accountId;
  String? recordId;
  bool enabled = false;
  bool saving = false;
}
