import 'package:flutter/material.dart';

class BunnaBankLogo extends StatelessWidget {
  const BunnaBankLogo({
    super.key,
    this.width = 120,
  });

  final double width;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/bunna-bank-logo.png',
      width: width,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) {
        return SizedBox(
          width: width,
          child: const Text(
            'Bunna Bank',
            textAlign: TextAlign.center,
          ),
        );
      },
    );
  }
}
