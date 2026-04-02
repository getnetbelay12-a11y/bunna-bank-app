import 'package:flutter/material.dart';

import '../../../../widgets/cbe_bank_logo.dart';
import '../../../../theme/cbe_bank_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CbeBankLogo(width: 160),
              SizedBox(height: 20),
              Text(
                'Bunna Bank',
                style: TextStyle(
                  color: cbeBlue,
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
