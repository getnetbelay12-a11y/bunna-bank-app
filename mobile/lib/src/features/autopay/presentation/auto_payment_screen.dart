import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../app/app_scope.dart';
import '../../../core/models/index.dart';
import '../../../shared/widgets/app_new_badge.dart';

class AutoPaymentScreen extends StatefulWidget {
  const AutoPaymentScreen({super.key});

  @override
  State<AutoPaymentScreen> createState() => _AutoPaymentScreenState();
}

class _AutoPaymentScreenState extends State<AutoPaymentScreen> {
  static const _catalog = <_AutopayBlueprint>[
    _AutopayBlueprint(
      serviceType: 'water',
      title: 'Water',
      subtitle: 'Monthly utility debit from primary account',
      accountId: 'primary_account',
      schedule: 'monthly',
    ),
    _AutopayBlueprint(
      serviceType: 'electricity',
      title: 'Electricity',
      subtitle: 'Monthly utility debit from primary account',
      accountId: 'primary_account',
      schedule: 'monthly',
    ),
    _AutopayBlueprint(
      serviceType: 'school_payment',
      title: 'School',
      subtitle: 'Monthly fee payment from primary account',
      accountId: 'primary_account',
      schedule: 'monthly',
    ),
    _AutopayBlueprint(
      serviceType: 'rent',
      title: 'Rent',
      subtitle: 'Monthly transfer to landlord or business partner',
      accountId: 'primary_account',
      schedule: 'monthly',
    ),
    _AutopayBlueprint(
      serviceType: 'employee_salary',
      title: 'Salary',
      subtitle: 'Payroll schedule from business account',
      accountId: 'business_account',
      schedule: 'payroll',
    ),
    _AutopayBlueprint(
      serviceType: 'transfer_to_savings',
      title: 'Transfer to Savings',
      subtitle: 'Scheduled savings movement every week',
      accountId: 'savings_account',
      schedule: 'weekly',
    ),
  ];

  Future<List<AutopayInstruction>>? _instructionsFuture;
  String? _message;
  final Set<String> _busyServices = <String>{};

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _instructionsFuture ??= _loadInstructions();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Recurring Payments'),
      ),
      body: SafeArea(
        child: FutureBuilder<List<AutopayInstruction>>(
          future: _instructionsFuture,
          builder: (context, snapshot) {
            final byType = {
              for (final item in snapshot.data ?? const <AutopayInstruction>[])
                item.serviceType: item,
            };

            return RefreshIndicator(
              onRefresh: () async {
                final next = _loadInstructions();
                setState(() {
                  _instructionsFuture = next;
                });
                await next;
              },
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text(
                    'Set recurring payments for utilities, school fees, rent, salary runs, and savings transfers without overloading daily banking screens.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: abayTextSoft,
                        ),
                  ),
                  const SizedBox(height: 16),
                  if (_message != null) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: abayPrimarySoft,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: abayBorder),
                      ),
                      child: Text(_message!),
                    ),
                    const SizedBox(height: 16),
                  ],
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: abayBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'AutoPay overview',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                            const SizedBox(width: 8),
                            const AppNewBadge(),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            _SummaryChip(
                              label: 'Enabled',
                              value:
                                  '${byType.values.where((item) => item.enabled).length}',
                            ),
                            _SummaryChip(
                              label: 'Utilities',
                              value: '${_countTypes(byType, const ['water', 'electricity'])}',
                            ),
                            _SummaryChip(
                              label: 'Savings',
                              value: byType['transfer_to_savings']?.enabled == true ? 'Active' : 'Off',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  for (final blueprint in _catalog) ...[
                    _AutopayTile(
                      blueprint: blueprint,
                      instruction: byType[blueprint.serviceType],
                      busy: _busyServices.contains(blueprint.serviceType),
                      onChanged: (enabled) => _toggleInstruction(
                        blueprint,
                        byType[blueprint.serviceType],
                        enabled,
                      ),
                    ),
                    if (blueprint != _catalog.last) const SizedBox(height: 12),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Future<List<AutopayInstruction>> _loadInstructions() {
    return AppScope.of(context).services.autopayApi.fetchInstructions();
  }

  Future<void> _toggleInstruction(
    _AutopayBlueprint blueprint,
    AutopayInstruction? current,
    bool enabled,
  ) async {
    setState(() {
      _busyServices.add(blueprint.serviceType);
      _message = null;
    });

    try {
      if (current == null && enabled) {
        await AppScope.of(context).services.autopayApi.createInstruction(
          provider: blueprint.serviceType,
          accountId: blueprint.accountId,
          schedule: blueprint.schedule,
        );
      } else if (current != null) {
        await AppScope.of(context).services.autopayApi.updateInstructionStatus(
          id: current.id,
          provider: blueprint.serviceType,
          enabled: enabled,
        );
      }

      if (!mounted) {
        return;
      }
      setState(() {
        _busyServices.remove(blueprint.serviceType);
        _message = '${blueprint.title} recurring payment updated successfully.';
        _instructionsFuture = _loadInstructions();
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _busyServices.remove(blueprint.serviceType);
        _message = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  int _countTypes(
    Map<String, AutopayInstruction> byType,
    List<String> serviceTypes,
  ) {
    return serviceTypes
        .where((type) => byType[type]?.enabled == true)
        .length;
  }
}

class _AutopayBlueprint {
  const _AutopayBlueprint({
    required this.serviceType,
    required this.title,
    required this.subtitle,
    required this.accountId,
    required this.schedule,
  });

  final String serviceType;
  final String title;
  final String subtitle;
  final String accountId;
  final String schedule;
}

class _AutopayTile extends StatelessWidget {
  const _AutopayTile({
    required this.blueprint,
    required this.instruction,
    required this.busy,
    required this.onChanged,
  });

  final _AutopayBlueprint blueprint;
  final AutopayInstruction? instruction;
  final bool busy;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final enabled = instruction?.enabled ?? false;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: abayBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 12,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              ConstrainedBox(
                constraints: const BoxConstraints(minWidth: 0, maxWidth: 520),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      blueprint.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      blueprint.subtitle,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: abayTextSoft,
                          ),
                    ),
                  ],
                ),
              ),
              Align(
                alignment: Alignment.centerLeft,
                child: Switch(
                  value: enabled,
                  onChanged: busy ? null : onChanged,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _MetaChip(label: 'Schedule', value: blueprint.schedule),
              _MetaChip(label: 'Account', value: blueprint.accountId.replaceAll('_', ' ')),
              _MetaChip(label: 'Status', value: enabled ? 'active' : 'paused'),
            ],
          ),
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: abaySurfaceAlt,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: abayTextSoft)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: abayBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '$label: $value',
        style: const TextStyle(
          color: abayTextSoft,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
