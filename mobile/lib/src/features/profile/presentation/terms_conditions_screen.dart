import 'package:flutter/material.dart';

class TermsConditionsScreen extends StatelessWidget {
  const TermsConditionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Terms and Conditions'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: const [
            Text(
              'Bunna Bank Membership Service Terms',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
            SizedBox(height: 12),
            Text(
              'Use of this app is protected by your registered mobile identity, PIN, and service eligibility. Sensitive actions such as phone number updates, KYC review, and support escalation may require additional verification.',
            ),
            SizedBox(height: 16),
            Text(
              'Loan, savings, payment, and support services may generate notifications and audit history. Shareholder governance features appear only when applicable to your membership type and active events.',
            ),
          ],
        ),
      ),
    );
  }
}
