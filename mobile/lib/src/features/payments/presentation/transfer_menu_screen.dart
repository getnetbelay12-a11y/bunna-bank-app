import 'package:flutter/material.dart';

import '../../../../theme/amhara_brand_theme.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_input.dart';
import '../../../shared/widgets/app_list_item.dart';
import 'payment_service_screen.dart';

class TransferMenuScreen extends StatelessWidget {
  const TransferMenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const items = [
      (
        'Transfer to Bank Account',
        'Transfer to another bank account.',
        Icons.compare_arrows_rounded,
      ),
      (
        'Transfer to Wallet',
        'Bank to wallet transfer.',
        Icons.account_balance_wallet_outlined,
      ),
      (
        'Make Payment to Beneficiary',
        'Transfer to your saved beneficiaries.',
        Icons.people_outline_rounded,
      ),
      (
        'Own Account Transfer',
        'Transfer between your accounts.',
        Icons.sync_alt_rounded,
      ),
      (
        'Local Money Transfer',
        'Transfer to any local customer.',
        Icons.currency_exchange_rounded,
      ),
      (
        'Transfer to own Telebirr Wallet',
        'Transfer to your own Telebirr wallet.',
        Icons.phone_android_rounded,
      ),
      (
        'Transfer to Other Banks',
        'Transfer to external bank accounts.',
        Icons.account_balance_outlined,
      ),
      (
        'Transfer to Micro Finance Institution',
        'Deposit to a micro finance institution.',
        Icons.store_mall_directory_outlined,
      ),
      (
        'Transfer to Agent',
        'Transfer to an approved agent.',
        Icons.support_agent_outlined,
      ),
    ];

    return AppScaffold(
      title: 'Transfer',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const AppHeader(
            title: 'Transfer',
            subtitle: 'Choose a transfer route and continue with the correct transfer workflow.',
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              children: [
                for (var index = 0; index < items.length; index++) ...[
                  AppListItem(
                    title: items[index].$1,
                    subtitle: items[index].$2,
                    icon: items[index].$3,
                    onTap: () {
                      if (items[index].$1 == 'Transfer to Bank Account') {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const BankAccountTransferEntryScreen(),
                          ),
                        );
                        return;
                      }

                      if (items[index].$1 == 'Transfer to Other Banks') {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const OtherBankTransferEntryScreen(),
                          ),
                        );
                        return;
                      }

                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => PaymentServiceScreen(
                            title: items[index].$1,
                            subtitle: items[index].$2,
                            icon: items[index].$3,
                            primaryActionLabel: 'Continue transfer',
                          ),
                        ),
                      );
                    },
                  ),
                  if (index != items.length - 1) const Divider(height: 1),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class BankAccountTransferEntryScreen extends StatefulWidget {
  const BankAccountTransferEntryScreen({super.key});

  @override
  State<BankAccountTransferEntryScreen> createState() => _BankAccountTransferEntryScreenState();
}

class _BankAccountTransferEntryScreenState extends State<BankAccountTransferEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _accountController = TextEditingController();
  bool _showRecipient = false;

  @override
  void dispose() {
    _accountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Saving - ETB - 7467',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const _SelectedAccountCard(
            title: 'Saving - ETB - 7467',
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Form(
              key: _formKey,
              child: AppInput(
                controller: _accountController,
                label: 'Account No',
                hintText: 'Account No',
                keyboardType: TextInputType.number,
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Account number is required.'
                    : null,
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
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => BankAccountTransferReviewScreen(
                      destinationAccount: _accountController.text.trim(),
                    ),
                  ),
                );
              },
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
                      child: const Icon(Icons.account_balance_wallet_outlined, color: abayPrimary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'YOSEF AMDU BELAY',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: abayPrimary,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _accountController.text.trim(),
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: abayTextSoft,
                                ),
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

class BankAccountTransferReviewScreen extends StatelessWidget {
  const BankAccountTransferReviewScreen({
    super.key,
    required this.destinationAccount,
  });

  final String destinationAccount;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Saving - ETB - 7467',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AppCard(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: abayAccentSoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.compare_arrows_rounded, color: abayPrimary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'YOSEF AMDU BELAY-ETB-6794',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: abayPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Debit Acc: GETNET AMIDU BELAY  Credit Acc: YOSEF AMDU BELAY-ETB-6794',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: abayTextSoft,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        destinationAccount,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: abayTextSoft,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: 'Continue',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const BankAccountTransferDetailsScreen(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class BankAccountTransferDetailsScreen extends StatefulWidget {
  const BankAccountTransferDetailsScreen({super.key});

  @override
  State<BankAccountTransferDetailsScreen> createState() => _BankAccountTransferDetailsScreenState();
}

class _BankAccountTransferDetailsScreenState extends State<BankAccountTransferDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _reasonController = TextEditingController();

  @override
  void dispose() {
    _amountController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Payment Details',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const _SelectedAccountCard(
            title: 'Payment Details',
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  AppInput(
                    controller: _amountController,
                    label: 'Amount',
                    hintText: 'Amount',
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Amount is required.'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  AppInput(
                    controller: _reasonController,
                    label: 'Reason',
                    hintText: 'Reason',
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Reason is required.'
                        : null,
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
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Transfer prepared for ETB ${_amountController.text.trim()} with reason "${_reasonController.text.trim()}".',
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _SelectedAccountCard extends StatelessWidget {
  const _SelectedAccountCard({
    required this.title,
  });

  final String title;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Selected',
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
                child: const Icon(Icons.drag_handle_rounded, color: abayPrimary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: abayPrimary,
                        fontWeight: FontWeight.w600,
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

class OtherBankTransferEntryScreen extends StatefulWidget {
  const OtherBankTransferEntryScreen({super.key});

  @override
  State<OtherBankTransferEntryScreen> createState() => _OtherBankTransferEntryScreenState();
}

class _OtherBankTransferEntryScreenState extends State<OtherBankTransferEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _accountNumberController = TextEditingController();
  String _selectedBank = 'Abay Bank';
  bool _showRecipient = false;

  @override
  void dispose() {
    _accountNumberController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Saving - ETB - 7467',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const _SelectedAccountCard(title: 'Saving - ETB - 7467'),
          const SizedBox(height: 16),
          AppCard(
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  _BankPickerField(
                    label: 'Choose Bank',
                    value: _selectedBank,
                    onTap: () async {
                      final selected = await showModalBottomSheet<String>(
                        context: context,
                        backgroundColor: Colors.transparent,
                        isScrollControlled: true,
                        builder: (_) => _BankSelectionSheet(selectedBank: _selectedBank),
                      );
                      if (selected != null && mounted) {
                        setState(() {
                          _selectedBank = selected;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                  AppInput(
                    controller: _accountNumberController,
                    label: 'Account Number',
                    hintText: 'Account Number',
                    keyboardType: TextInputType.number,
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Account number is required.'
                        : null,
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
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => OtherBankTransferReviewScreen(
                      bankName: _selectedBank,
                      destinationAccount: _accountNumberController.text.trim(),
                    ),
                  ),
                );
              },
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
                      child: const Icon(Icons.account_balance_outlined, color: abayPrimary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'YOSEF AMDU BELAY',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: abayPrimary,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$_selectedBank · ${_accountNumberController.text.trim()}',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: abayTextSoft,
                                ),
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

class OtherBankTransferReviewScreen extends StatelessWidget {
  const OtherBankTransferReviewScreen({
    super.key,
    required this.bankName,
    required this.destinationAccount,
  });

  final String bankName;
  final String destinationAccount;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Transfer to Other Banks',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const AppHeader(
            title: 'Transfer to Other Banks',
            subtitle: 'Transfer to external bank accounts.',
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF2BF),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.account_balance_outlined, color: abayPrimary),
                ),
                const SizedBox(height: 16),
                Text(
                  'Selected transfer',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  '$bankName · $destinationAccount',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: abayTextSoft,
                      ),
                ),
                const SizedBox(height: 16),
                AppButton(
                  label: 'Continue transfer',
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => OtherBankTransferDetailsScreen(
                          bankName: bankName,
                          destinationAccount: destinationAccount,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class OtherBankTransferDetailsScreen extends StatefulWidget {
  const OtherBankTransferDetailsScreen({
    super.key,
    required this.bankName,
    required this.destinationAccount,
  });

  final String bankName;
  final String destinationAccount;

  @override
  State<OtherBankTransferDetailsScreen> createState() => _OtherBankTransferDetailsScreenState();
}

class _OtherBankTransferDetailsScreenState extends State<OtherBankTransferDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _reasonController = TextEditingController();

  @override
  void dispose() {
    _amountController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Payment Details',
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _SelectedAccountCard(title: '${widget.bankName} payment'),
          const SizedBox(height: 16),
          AppCard(
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  AppInput(
                    controller: _amountController,
                    label: 'Amount',
                    hintText: 'Amount',
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Amount is required.'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  AppInput(
                    controller: _reasonController,
                    label: 'Reason',
                    hintText: 'Reason',
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Reason is required.'
                        : null,
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
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Prepared ETB ${_amountController.text.trim()} transfer to ${widget.bankName} account ${widget.destinationAccount}.',
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _BankPickerField extends StatelessWidget {
  const _BankPickerField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.keyboard_arrow_down_rounded),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: abayBorderStrong),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: abayPrimary, width: 1.6),
          ),
        ),
        child: Text(
          value,
          style: Theme.of(context).textTheme.bodyLarge,
        ),
      ),
    );
  }
}

class _BankSelectionSheet extends StatelessWidget {
  const _BankSelectionSheet({
    required this.selectedBank,
  });

  final String selectedBank;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.72,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: abayBorderStrong,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Choose bank',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.separated(
              itemCount: _ethiopianBanks.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = _ethiopianBanks[index];
                final isSelected = item == selectedBank;
                return InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => Navigator.of(context).pop(item),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSelected ? abayPrimary : abayBorder,
                      ),
                      boxShadow: const [
                        BoxShadow(
                          color: abayShadow,
                          blurRadius: 12,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            item,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isSelected ? abayPrimary : null,
                                ),
                          ),
                        ),
                        if (isSelected)
                          const Icon(Icons.check_circle_rounded, color: abayPrimary),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

const _ethiopianBanks = <String>[
  'Abay Bank',
  'Addis Bank',
  'Ahadu Bank',
  'Ahadu E-birr',
  'Bunna Bank',
  'Anbesa Int. Bank',
  'Awash International Bank',
  'Bank of Abyssinia',
  'Berhan International Bank',
  'Bunna International Bank',
  'Cooperative Bank of Oromia',
  'Dashen Bank',
  'Debub Global Bank',
  'DECSI-Microfinance',
  'Dire MFI',
  'Enat Bank',
  'Gadaa Bank',
  'Goh Betoch Bank',
  'H-CASH',
  'HALAL PAY',
  'Hibret Bank',
  'Hijra Bank',
  'KAAFI Micro Finance',
  'Kacha',
  'MPESA',
  'Nib Bank',
  'NIB EBIRR',
  'Nisir Microfinance',
  'Omo Bank',
  'One Micro Finance',
  'Oromia Bank',
  'Rammis Bank',
  'RAYs Micro Finance Institution',
  'Sahal Microfinance',
  'Shebelle Bank',
  'Siinqee Bank',
  'Siket Bank',
  'Sidama Bank',
  'Telebirr',
  'Tsedey Bank',
  'Tsehay Bank',
  'Vision Fund Micro Finance',
  'Wegagen Bank',
  'Wegagen E-Birr',
  'YaYa Wallet',
  'ZamZam Bank',
  'Zemen Bank',
];
