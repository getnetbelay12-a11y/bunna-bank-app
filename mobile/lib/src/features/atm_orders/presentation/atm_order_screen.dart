import 'package:flutter/material.dart';

class AtmOrderScreen extends StatefulWidget {
  const AtmOrderScreen({super.key});

  @override
  State<AtmOrderScreen> createState() => _AtmOrderScreenState();
}

class _AtmOrderScreenState extends State<AtmOrderScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _locationController = TextEditingController(text: 'Bahir Dar Branch ATM');
  final _timeController = TextEditingController(text: 'Tomorrow, 10:00 - 12:00');

  @override
  void dispose() {
    _amountController.dispose();
    _locationController.dispose();
    _timeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ATM Order')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            20 + MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                TextFormField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Amount'),
                  validator: (value) =>
                      (value == null || value.trim().isEmpty)
                          ? 'Amount is required.'
                          : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _locationController,
                  decoration: const InputDecoration(labelText: 'Branch/ATM Location'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _timeController,
                  decoration: const InputDecoration(labelText: 'Pickup Time Window'),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {
                      _formKey.currentState!.validate();
                    },
                    child: const Text('Create ATM Order'),
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
