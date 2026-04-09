import 'package:flutter/material.dart';

import '../../../../widgets/bunna_bank_logo_compat.dart';
import '../../../../widgets/bunna_bank_mark.dart';
import '../../../../theme/amhara_brand_theme.dart';

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
              BunnaBankMark(width: 132),
              SizedBox(height: 16),
              BunnaBankLogo(width: 150),
              SizedBox(height: 20),
              Text(
                'Bunna Bank',
                style: TextStyle(
                  color: abayPrimary,
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
