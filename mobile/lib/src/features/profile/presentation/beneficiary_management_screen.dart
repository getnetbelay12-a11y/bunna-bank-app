import 'package:flutter/material.dart';

class BeneficiaryManagementScreen extends StatelessWidget {
  const BeneficiaryManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Beneficiary Management'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: const [
            ListTile(
              leading: Icon(Icons.person_add_alt_rounded),
              title: Text('Add trusted beneficiary'),
              subtitle: Text('Save frequent recipients for faster payments.'),
            ),
            ListTile(
              leading: Icon(Icons.verified_user_outlined),
              title: Text('Review beneficiary verification'),
              subtitle: Text('Confirm recipient details before sending money.'),
            ),
            ListTile(
              leading: Icon(Icons.manage_accounts_outlined),
              title: Text('Manage saved recipients'),
              subtitle: Text('Edit, pause, or remove existing beneficiaries.'),
            ),
          ],
        ),
      ),
    );
  }
}
