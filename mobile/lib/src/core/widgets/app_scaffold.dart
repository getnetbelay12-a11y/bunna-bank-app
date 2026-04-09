import 'package:flutter/material.dart';

class AppScaffold extends StatelessWidget {
  const AppScaffold({
    super.key,
    required this.title,
    required this.body,
    this.showBack,
    this.actions,
    this.resizeToAvoidBottomInset = true,
  });

  final String title;
  final Widget body;
  final bool? showBack;
  final List<Widget>? actions;
  final bool resizeToAvoidBottomInset;

  @override
  Widget build(BuildContext context) {
    final effectiveShowBack = showBack ?? Navigator.of(context).canPop();

    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      appBar: AppBar(
        automaticallyImplyLeading: effectiveShowBack,
        leading: effectiveShowBack ? const BackButton() : null,
        title: Text(title),
        actions: actions,
      ),
      body: SafeArea(child: body),
    );
  }
}
