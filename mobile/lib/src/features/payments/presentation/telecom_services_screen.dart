import 'package:flutter/material.dart';

import '../../../core/widgets/app_scaffold.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/app_input.dart';
import '../../../shared/widgets/app_tile.dart';

const _ethioTelecomLogoAsset = 'assets/images/ethiotelecom-logo.png';
const _safaricomLogoAsset = 'assets/images/safaricom-logo.png';

class TelecomServicesScreen extends StatelessWidget {
  const TelecomServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _TelecomMenuScreen(
      title: 'Telecom Services',
      subtitle: 'Top-up, post-paid, and wallet-linked telecom payment services in one place.',
      items: [
        _TelecomMenuItem(
          title: 'Airtime',
          subtitle: 'Airtime top-up',
          leading: const _TelecomLeadingIcon(icon: Icons.phone_android_rounded),
          onTap: () => _open(context, const AirtimeServicesScreen()),
        ),
        _TelecomMenuItem(
          title: 'Ethio telecom Services',
          subtitle: 'Ethio telecom services payment',
          leading: const _ProviderLogo(assetPath: _ethioTelecomLogoAsset),
          onTap: () => _open(context, const EthioTelecomServicesScreen()),
        ),
        _TelecomMenuItem(
          title: 'Safaricom Services',
          subtitle: 'Safaricom services payment',
          leading: const _ProviderLogo(assetPath: _safaricomLogoAsset),
          onTap: () => _open(context, const SafaricomServicesScreen()),
        ),
      ],
    );
  }
}

class AirtimeServicesScreen extends StatelessWidget {
  const AirtimeServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _TelecomMenuScreen(
      title: 'Airtime',
      subtitle: 'Choose a telecom provider for airtime top-up.',
      items: [
        _TelecomMenuItem(
          title: 'Buy Ethiotelecom Airtime',
          subtitle: 'Ethiotelecom Airtime TopUp',
          leading: const _ProviderLogo(assetPath: _ethioTelecomLogoAsset),
          onTap: () => _open(
            context,
            TelecomEntryFormScreen(
              screenTitle: 'Enter',
              serviceTitle: 'Buy Ethiotelecom Airtime',
              helper: 'Enter the mobile number and airtime amount.',
              firstFieldLabel: 'Recharged Mob No',
              secondFieldLabel: 'Amount',
              onContinue: (phone, amount) => TelecomReviewScreen(
                title: 'Buy Ethiotelecom Airtime',
                accountTitle: 'Saving - ETB - 7467',
                balance: 'ETB39,069.88',
                summary:
                    'Top-up from Saving - ETB - 7467 for $phone. Amount ETB $amount.',
              ),
            ),
          ),
        ),
        _TelecomMenuItem(
          title: 'Buy Safaricom Airtime',
          subtitle: 'Safaricom Airtime TopUp',
          leading: const _ProviderLogo(assetPath: _safaricomLogoAsset),
          onTap: () => _open(
            context,
            TelecomEntryFormScreen(
              screenTitle: 'Enter',
              serviceTitle: 'Buy Safaricom Airtime',
              helper: 'Enter the mobile number and airtime amount.',
              firstFieldLabel: 'Recharged Mob No',
              secondFieldLabel: 'Amount',
              onContinue: (phone, amount) => TelecomReviewScreen(
                title: 'Buy Safaricom Airtime',
                accountTitle: 'Saving - ETB - 7467',
                balance: 'ETB39,069.88',
                summary:
                    'Top-up from Saving - ETB - 7467 for $phone. Amount ETB $amount.',
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class EthioTelecomServicesScreen extends StatelessWidget {
  const EthioTelecomServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _TelecomMenuScreen(
      title: 'Ethio telecom Services',
      subtitle: 'Ethio telecom airtime, post-paid, and telebirr wallet services.',
      items: [
        _TelecomMenuItem(
          title: 'Buy Ethiotelecom Airtime',
          subtitle: 'Ethiotelecom Airtime TopUp',
          leading: const _ProviderLogo(assetPath: _ethioTelecomLogoAsset),
          onTap: () => _open(
            context,
            TelecomEntryFormScreen(
              screenTitle: 'Enter',
              serviceTitle: 'Buy Ethiotelecom Airtime',
              helper: 'Enter the mobile number and airtime amount.',
              firstFieldLabel: 'Recharged Mob No',
              secondFieldLabel: 'Amount',
              onContinue: (phone, amount) => TelecomReviewScreen(
                title: 'Buy Ethiotelecom Airtime',
                accountTitle: 'Saving - ETB - 7467',
                balance: 'ETB39,069.88',
                summary:
                    'Top-up from Saving - ETB - 7467 for $phone. Amount ETB $amount.',
              ),
            ),
          ),
        ),
        _TelecomMenuItem(
          title: 'Ethio-Telecom Post-Paid',
          subtitle: 'Ethio-Telecom Post-Paid Bill Payment',
          leading: const _ProviderLogo(assetPath: _ethioTelecomLogoAsset),
          onTap: () => _open(
            context,
            TelecomEntryFormScreen(
              screenTitle: 'Enter',
              serviceTitle: 'Ethio-Telecom Post-Paid',
              helper: 'Enter the post-paid mobile number and amount.',
              firstFieldLabel: 'Recharged Mob No',
              secondFieldLabel: 'Amount',
              onContinue: (phone, amount) => TelecomAmountRemarkScreen(
                title: 'Enter',
                serviceTitle: 'Ethio-Telecom Post-Paid',
                amount: amount,
                onContinue: (updatedAmount, remark) => TelecomReviewScreen(
                  title: 'Ethio-Telecom Post-Paid',
                  accountTitle: 'Saving - ETB - 7467',
                  balance: 'ETB39,069.88',
                  summary:
                      'Post-paid payment for $phone. Amount ETB $updatedAmount. Remark: ${remark.isEmpty ? 'None' : remark}.',
                ),
              ),
            ),
          ),
        ),
        _TelecomMenuItem(
          title: 'Transfer to own telebirr wallet',
          subtitle: 'Transfer to own telebirr wallet account',
          leading: const _TelecomLeadingIcon(icon: Icons.account_balance_wallet_outlined),
          onTap: () => _open(
            context,
            TelecomEntryFormScreen(
              screenTitle: 'Enter',
              serviceTitle: 'Transfer to own telebirr wallet',
              helper: 'Enter the telebirr mobile number and amount.',
              firstFieldLabel: 'Recharged Mob No',
              secondFieldLabel: 'Amount',
              onContinue: (phone, amount) => TelecomAmountRemarkScreen(
                title: 'Enter',
                serviceTitle: 'Transfer to own telebirr wallet',
                amount: amount,
                onContinue: (updatedAmount, remark) => TelecomReviewScreen(
                  title: 'Transfer to own telebirr wallet',
                  accountTitle: 'Saving - ETB - 7467',
                  balance: 'ETB39,069.88',
                  summary:
                      'Request transfer from Saving - ETB - 7467 for Getnet Amidu Belay. Phone Number: $phone. Amount ETB $updatedAmount. Remark: ${remark.isEmpty ? 'None' : remark}.',
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class SafaricomServicesScreen extends StatelessWidget {
  const SafaricomServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _TelecomMenuScreen(
      title: 'Safaricom Services',
      subtitle: 'Safaricom airtime, post-pay, deposit, and wallet transfer services.',
      items: [
        _TelecomMenuItem(
          title: 'Buy Safaricom Airtime',
          subtitle: 'Safaricom Airtime TopUp',
          leading: const _ProviderLogo(assetPath: _safaricomLogoAsset),
          onTap: () => _open(
            context,
            TelecomEntryFormScreen(
              screenTitle: 'Enter',
              serviceTitle: 'Buy Safaricom Airtime',
              helper: 'Enter the mobile number and airtime amount.',
              firstFieldLabel: 'Recharged Mob No',
              secondFieldLabel: 'Amount',
              onContinue: (phone, amount) => TelecomReviewScreen(
                title: 'Buy Safaricom Airtime',
                accountTitle: 'Saving - ETB - 7467',
                balance: 'ETB39,069.88',
                summary:
                    'Top-up from Saving - ETB - 7467 for $phone. Amount ETB $amount.',
              ),
            ),
          ),
        ),
        _TelecomMenuItem(
          title: 'Safaricom PostPay Bill Payment',
          subtitle: 'Safaricom PostPay Bill Payment',
          leading: const _ProviderLogo(assetPath: _safaricomLogoAsset),
          onTap: () => _open(
            context,
            TelecomEntryFormScreen(
              screenTitle: 'Enter',
              serviceTitle: 'Safaricom PostPay Bill Payment',
              helper: 'Enter the mobile number and bill amount.',
              firstFieldLabel: 'Recharged Mob No',
              secondFieldLabel: 'Amount',
              onContinue: (phone, amount) => TelecomReviewScreen(
                title: 'Safaricom PostPay Bill Payment',
                accountTitle: 'Saving - ETB - 7467',
                balance: 'ETB39,069.88',
                summary:
                    'Post-pay bill payment for $phone. Amount ETB $amount.',
              ),
            ),
          ),
        ),
        _TelecomMenuItem(
          title: 'Safaricom PostPay Deposit Payment',
          subtitle: 'Safaricom PostPay Deposit Payment',
          leading: const _ProviderLogo(assetPath: _safaricomLogoAsset),
          onTap: () => _open(
            context,
            TelecomEntryFormScreen(
              screenTitle: 'Enter',
              serviceTitle: 'Safaricom PostPay Deposit Payment',
              helper: 'Enter the mobile number and deposit amount.',
              firstFieldLabel: 'Recharged Mob No',
              secondFieldLabel: 'Amount',
              onContinue: (phone, amount) => TelecomReviewScreen(
                title: 'Safaricom PostPay Deposit Payment',
                accountTitle: 'Saving - ETB - 7467',
                balance: 'ETB39,069.88',
                summary:
                    'Post-pay deposit payment for $phone. Amount ETB $amount.',
              ),
            ),
          ),
        ),
        _TelecomMenuItem(
          title: 'Transfer to M-PESA Wallet',
          subtitle: 'Transfer to M-PESA wallet account',
          leading: const _ProviderLogo(assetPath: _safaricomLogoAsset),
          onTap: () => _open(
            context,
            TelecomEntryFormScreen(
              screenTitle: 'Enter',
              serviceTitle: 'Transfer to M-PESA Wallet',
              helper: 'Enter the wallet mobile number and amount.',
              firstFieldLabel: 'Recharged Mob No',
              secondFieldLabel: 'Amount',
              onContinue: (phone, amount) => TelecomReviewScreen(
                title: 'Transfer to M-PESA Wallet',
                accountTitle: 'Saving - ETB - 7467',
                balance: 'ETB39,069.88',
                summary:
                    'Wallet transfer from Saving - ETB - 7467 for $phone. Amount ETB $amount.',
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class TelecomEntryFormScreen extends StatefulWidget {
  const TelecomEntryFormScreen({
    super.key,
    required this.screenTitle,
    required this.serviceTitle,
    required this.helper,
    required this.firstFieldLabel,
    required this.secondFieldLabel,
    required this.onContinue,
  });

  final String screenTitle;
  final String serviceTitle;
  final String helper;
  final String firstFieldLabel;
  final String secondFieldLabel;
  final Widget Function(String firstValue, String secondValue) onContinue;

  @override
  State<TelecomEntryFormScreen> createState() => _TelecomEntryFormScreenState();
}

class _TelecomEntryFormScreenState extends State<TelecomEntryFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstController = TextEditingController();
  final _secondController = TextEditingController();

  @override
  void dispose() {
    _firstController.dispose();
    _secondController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: widget.screenTitle,
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AppHeader(
            title: widget.serviceTitle,
            subtitle: widget.helper,
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  AppInput(
                    controller: _firstController,
                    label: widget.firstFieldLabel,
                    hintText: widget.firstFieldLabel,
                    keyboardType: TextInputType.phone,
                    validator: (value) =>
                        value == null || value.trim().isEmpty ? '${widget.firstFieldLabel} is required.' : null,
                  ),
                  const SizedBox(height: 16),
                  AppInput(
                    controller: _secondController,
                    label: widget.secondFieldLabel,
                    hintText: widget.secondFieldLabel,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: (value) =>
                        value == null || value.trim().isEmpty ? '${widget.secondFieldLabel} is required.' : null,
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
                widget.onContinue(
                  _firstController.text.trim(),
                  _secondController.text.trim(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class TelecomAmountRemarkScreen extends StatefulWidget {
  const TelecomAmountRemarkScreen({
    super.key,
    required this.title,
    required this.serviceTitle,
    required this.amount,
    required this.onContinue,
  });

  final String title;
  final String serviceTitle;
  final String amount;
  final Widget Function(String amount, String remark) onContinue;

  @override
  State<TelecomAmountRemarkScreen> createState() => _TelecomAmountRemarkScreenState();
}

class _TelecomAmountRemarkScreenState extends State<TelecomAmountRemarkScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amountController = TextEditingController(text: widget.amount);
  final _remarkController = TextEditingController();

  @override
  void dispose() {
    _amountController.dispose();
    _remarkController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: widget.title,
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AppHeader(
            title: widget.serviceTitle,
            subtitle: 'Review the amount and add an optional remark before confirmation.',
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
                    validator: (value) => value == null || value.trim().isEmpty ? 'Amount is required.' : null,
                  ),
                  const SizedBox(height: 16),
                  AppInput(
                    controller: _remarkController,
                    label: 'Remark',
                    hintText: 'Remark',
                    maxLines: 2,
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
                widget.onContinue(
                  _amountController.text.trim(),
                  _remarkController.text.trim(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class TelecomReviewScreen extends StatelessWidget {
  const TelecomReviewScreen({
    super.key,
    required this.title,
    required this.accountTitle,
    required this.balance,
    required this.summary,
  });

  final String title;
  final String accountTitle;
  final String balance;
  final String summary;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: title,
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
                    color: const Color(0xFFFFF2BF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.account_balance_wallet_outlined,
                    color: Color(0xFF0A4FA3),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$accountTitle - Balance $balance',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        summary,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: 'Confirm',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('$title request is ready for processing.')),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _TelecomMenuScreen extends StatelessWidget {
  const _TelecomMenuScreen({
    required this.title,
    required this.subtitle,
    required this.items,
  });

  final String title;
  final String subtitle;
  final List<_TelecomMenuItem> items;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: title,
      showBack: true,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AppHeader(
            title: title,
            subtitle: subtitle,
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              children: [
                for (var index = 0; index < items.length; index++) ...[
                  AppTile(
                    title: items[index].title,
                    subtitle: items[index].subtitle,
                    leading: items[index].leading,
                    onTap: items[index].onTap,
                    trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF7A8AA0)),
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

class _TelecomMenuItem {
  const _TelecomMenuItem({
    required this.title,
    required this.subtitle,
    required this.leading,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final Widget leading;
  final VoidCallback onTap;
}

class _ProviderLogo extends StatelessWidget {
  const _ProviderLogo({
    required this.assetPath,
  });

  final String assetPath;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F7FB),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Image.asset(
        assetPath,
        fit: BoxFit.contain,
      ),
    );
  }
}

class _TelecomLeadingIcon extends StatelessWidget {
  const _TelecomLeadingIcon({
    required this.icon,
  });

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: const Color(0xFFF4F7FB),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: const Color(0xFF0A4FA3)),
    );
  }
}

void _open(BuildContext context, Widget screen) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(builder: (_) => screen),
  );
}
