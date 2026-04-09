import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_input.dart';
import '../../../shared/widgets/app_list_item.dart';

class TelebirrTransferScreen extends StatelessWidget {
  const TelebirrTransferScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Telebirr',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const AppHeader(
            title: 'Telebirr Transfer',
            subtitle: 'Transfer to your own Telebirr wallet or to a different Telebirr phone number.',
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              children: [
                AppListItem(
                  title: 'Own Telebirr Wallet',
                  subtitle: 'Transfer from your bank account to your own Telebirr wallet.',
                  icon: Icons.account_balance_wallet_outlined,
                  onTap: () => _open(context, const OwnTelebirrTransferEntryScreen()),
                ),
                const Divider(height: 1),
                AppListItem(
                  title: 'Other Telebirr Number',
                  subtitle: 'Transfer to another Telebirr phone number and confirm the recipient.',
                  icon: Icons.phone_android_rounded,
                  onTap: () => _open(context, const OtherTelebirrTransferEntryScreen()),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class OwnTelebirrTransferEntryScreen extends StatefulWidget {
  const OwnTelebirrTransferEntryScreen({super.key});

  @override
  State<OwnTelebirrTransferEntryScreen> createState() => _OwnTelebirrTransferEntryScreenState();
}

class _OwnTelebirrTransferEntryScreenState extends State<OwnTelebirrTransferEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController(text: '0911000001');
  final _amountController = TextEditingController();
  final _remarkController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    _amountController.dispose();
    _remarkController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Own Telebirr Wallet',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const _TelebirrSourceCard(),
          const SizedBox(height: 16),
          AppCard(
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  AppInput(
                    controller: _phoneController,
                    label: 'Telebirr Phone Number',
                    hintText: '0911000001',
                    keyboardType: TextInputType.phone,
                    validator: (value) =>
                        value == null || value.trim().isEmpty ? 'Telebirr phone number is required.' : null,
                  ),
                  const SizedBox(height: 16),
                  AppInput(
                    controller: _amountController,
                    label: 'Amount',
                    hintText: 'Amount',
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: (value) =>
                        value == null || value.trim().isEmpty ? 'Amount is required.' : null,
                  ),
                  const SizedBox(height: 16),
                  AppInput(
                    controller: _remarkController,
                    label: 'Remark',
                    hintText: 'Optional remark',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: 'Continue',
            onPressed: () {
              if (!_formKey.currentState!.validate()) {
                return;
              }
              _open(
                context,
                TelebirrTransferReviewScreen(
                  title: 'Own Telebirr Wallet',
                  recipientName: 'Getnet Belay',
                  phoneNumber: _phoneController.text.trim(),
                  amount: _amountController.text.trim(),
                  remark: _remarkController.text.trim(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class OtherTelebirrTransferEntryScreen extends StatefulWidget {
  const OtherTelebirrTransferEntryScreen({super.key});

  @override
  State<OtherTelebirrTransferEntryScreen> createState() => _OtherTelebirrTransferEntryScreenState();
}

class _OtherTelebirrTransferEntryScreenState extends State<OtherTelebirrTransferEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _amountController = TextEditingController();
  final _remarkController = TextEditingController();
  bool _showRecipient = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _amountController.dispose();
    _remarkController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Other Telebirr Number',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const _TelebirrSourceCard(),
          const SizedBox(height: 16),
          AppCard(
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  AppInput(
                    controller: _phoneController,
                    label: 'Recipient Telebirr Number',
                    hintText: '09XXXXXXXX',
                    keyboardType: TextInputType.phone,
                    validator: (value) =>
                        value == null || value.trim().isEmpty ? 'Recipient phone number is required.' : null,
                  ),
                  const SizedBox(height: 16),
                  AppInput(
                    controller: _amountController,
                    label: 'Amount',
                    hintText: 'Amount',
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: (value) =>
                        value == null || value.trim().isEmpty ? 'Amount is required.' : null,
                  ),
                  const SizedBox(height: 16),
                  AppInput(
                    controller: _remarkController,
                    label: 'Remark',
                    hintText: 'Optional remark',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: 'Continue',
            onPressed: () {
              if (!_formKey.currentState!.validate()) {
                return;
              }
              setState(() {
                _showRecipient = true;
              });
            },
          ),
          if (_showRecipient) ...[
            const SizedBox(height: 16),
            InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => _open(
                context,
                TelebirrTransferReviewScreen(
                  title: 'Other Telebirr Number',
                  recipientName: 'Mahi Kebede',
                  phoneNumber: _phoneController.text.trim(),
                  amount: _amountController.text.trim(),
                  remark: _remarkController.text.trim(),
                ),
              ),
              child: AppCard(
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: abaySurfaceAlt,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.person_outline_rounded, color: abayPrimary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Mahi Kebede',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: abayPrimary,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _phoneController.text.trim(),
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: abayTextSoft),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class TelebirrTransferReviewScreen extends StatelessWidget {
  const TelebirrTransferReviewScreen({
    super.key,
    required this.title,
    required this.recipientName,
    required this.phoneNumber,
    required this.amount,
    required this.remark,
  });

  final String title;
  final String recipientName;
  final String phoneNumber;
  final String amount;
  final String remark;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: title,
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const _TelebirrSourceCard(),
          const SizedBox(height: 16),
          AppCard(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: abayAccentSoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.account_balance_wallet_outlined, color: abayPrimary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        recipientName,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: abayPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Telebirr number: $phoneNumber',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: abayTextSoft),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Amount: ETB $amount',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: abayTextSoft),
                      ),
                      if (remark.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Remark: $remark',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: abayTextSoft),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: 'Confirm Transfer',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Telebirr transfer of ETB $amount is ready for processing.'),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _TelebirrSourceCard extends StatelessWidget {
  const _TelebirrSourceCard();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Selected account',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: abayPrimary,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: abaySurfaceAlt,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.account_balance_wallet_outlined, color: abayPrimary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Saving - ETB - 7467',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: abayPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

void _open(BuildContext context, Widget screen) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(builder: (_) => screen),
  );
}
