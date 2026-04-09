import 'package:flutter/material.dart';

import '../../../app/app_controller.dart';
import '../../../app/app_scope.dart';

class ResetPinScreen extends StatefulWidget {
  const ResetPinScreen({
    super.key,
    required this.phoneNumber,
    this.email,
  });

  static const routeName = '/reset-pin';

  final String phoneNumber;
  final String? email;

  @override
  State<ResetPinScreen> createState() => _ResetPinScreenState();
}

class _ResetPinScreenState extends State<ResetPinScreen> {
  final _formKey = GlobalKey<FormState>();
  final _newPinController = TextEditingController();
  final _confirmPinController = TextEditingController();
  String? _message;
  bool _submitting = false;

  @override
  void dispose() {
    _newPinController.dispose();
    _confirmPinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;
    final controller = AppScope.of(context);
    final isAmharic = controller.language == AppLanguage.amharic;

    return Scaffold(
      appBar: AppBar(title: Text(isAmharic ? 'አዲስ ፒን አዘጋጅ' : 'Reset PIN')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            24,
            24,
            24,
            24 + MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isAmharic ? 'አዲስ ፒን ያስገቡ' : 'Set a new PIN',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  isAmharic
                      ? 'ለአባልነት መለያዎ ከ4 እስከ 6 አሃዝ ያለው አዲስ ፒን ይምረጡ።'
                      : 'Choose a new 4 to 6 digit PIN for your member account.',
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _newPinController,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  maxLength: 6,
                  decoration: InputDecoration(
                      labelText: isAmharic ? 'አዲስ ፒን' : 'New PIN'),
                  validator: (value) {
                    final trimmed = value?.trim() ?? '';
                    if (trimmed.isEmpty) {
                      return isAmharic
                          ? 'አዲስ ፒን ያስፈልጋል።'
                          : 'New PIN is required.';
                    }
                    if (!RegExp(r'^\d{4,6}$').hasMatch(trimmed)) {
                      return isAmharic
                          ? 'ፒኑ ከ4 እስከ 6 አሃዝ መሆን አለበት።'
                          : 'PIN must be 4 to 6 digits.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _confirmPinController,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  maxLength: 6,
                  decoration: InputDecoration(
                    labelText: isAmharic ? 'ፒንን ያረጋግጡ' : 'Confirm PIN',
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return isAmharic
                          ? 'የፒን ማረጋገጫ ያስፈልጋል።'
                          : 'Confirm PIN is required.';
                    }
                    if (value.trim() != _newPinController.text.trim()) {
                      return isAmharic
                          ? 'የፒን ማረጋገጫ አይዛመድም።'
                          : 'PIN confirmation does not match.';
                    }
                    return null;
                  },
                ),
                if (_message != null) ...[
                  const SizedBox(height: 12),
                  Text(_message!),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _submitting
                        ? null
                        : () async {
                            if (!_formKey.currentState!.validate()) {
                              return;
                            }

                            setState(() {
                              _submitting = true;
                              _message = null;
                            });

                            try {
                              await services.authApi.resetPin(
                                phoneNumber: widget.phoneNumber,
                                email: widget.email,
                                newPin: _newPinController.text.trim(),
                                confirmPin: _confirmPinController.text.trim(),
                              );

                              if (!context.mounted) {
                                return;
                              }

                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(isAmharic
                                      ? 'ፒኑ በተሳካ ሁኔታ ተቀይሯል።'
                                      : 'PIN updated successfully.'),
                                ),
                              );
                              Navigator.of(context)
                                  .popUntil((route) => route.isFirst);
                            } catch (error) {
                              if (!mounted) {
                                return;
                              }
                              setState(() {
                                _submitting = false;
                                _message = error
                                    .toString()
                                    .replaceFirst('Exception: ', '');
                              });
                            }
                          },
                    child: Text(
                      _submitting
                          ? (isAmharic ? 'በማዘመን ላይ...' : 'Updating...')
                          : (isAmharic ? 'ፒን አዘምን' : 'Update PIN'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
