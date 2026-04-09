import 'package:flutter/material.dart';

import '../../../app/app_scope.dart';
import '../../../core/models/service_request.dart';

class ServiceRequestDetailScreen extends StatelessWidget {
  const ServiceRequestDetailScreen({
    super.key,
    required this.requestId,
  });

  final String requestId;

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context).services;

    return Scaffold(
      appBar: AppBar(title: const Text('Request Detail')),
      body: FutureBuilder(
        future: services.serviceRequestApi.fetchRequestDetail(requestId),
        builder: (context, snapshot) {
          final item = snapshot.data;
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (item == null) {
            return const Center(child: Text('Unable to load request.'));
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(item.title, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(_formatLabel(item.status)),
              const SizedBox(height: 12),
              Text(item.description),
              if (item.latestNote != null) ...[
                const SizedBox(height: 16),
                Text('Latest note', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 6),
                Text(item.latestNote!),
              ],
              if (_buildRequestFacts(item).isNotEmpty) ...[
                const SizedBox(height: 20),
                Text('Request details', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                ..._buildRequestFacts(item).map(
                  (fact) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: Text(fact.label),
                    subtitle: Text(fact.value!),
                  ),
                ),
              ],
              if (item.attachments.isNotEmpty) ...[
                const SizedBox(height: 20),
                Text('Attachments', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                ...item.attachments.map(
                  (attachment) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: Text(attachment),
                  ),
                ),
              ],
              const SizedBox(height: 20),
              Text('Timeline', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              for (final event in item.timeline)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(_formatLabel(event.eventType)),
                  subtitle: Text(event.note ?? event.actorName ?? event.actorType),
                ),
            ],
          );
        },
      ),
    );
  }
}

String _formatLabel(String value) {
  return value
      .replaceAll('_', ' ')
      .split(' ')
      .map((part) => part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

List<_RequestFact> _buildRequestFacts(ServiceRequest item) {
  switch (item.type) {
    case 'phone_update':
      return _compactFacts([
        _RequestFact('Requested phone number', _stringValue(item.payload['requestedPhoneNumber'])),
      ]);
    case 'account_relationship':
      return _compactFacts([
        _RequestFact('Relationship type', _stringValue(item.payload['relationshipType'])),
        _RequestFact('Related member number', _stringValue(item.payload['relatedMemberNumber'])),
        _RequestFact('Related customer ID', _stringValue(item.payload['relatedCustomerId'])),
      ]);
    case 'atm_card_request':
      return _compactFacts([
        _RequestFact('Preferred branch', _stringValue(item.payload['preferredBranch'])),
        _RequestFact('Card type', _stringValue(item.payload['cardType'])),
        _RequestFact('Reason', _stringValue(item.payload['reason'])),
      ]);
    case 'failed_transfer':
    case 'payment_dispute':
      return _compactFacts([
        _RequestFact(
          'Transaction reference',
          _stringValue(item.payload['transactionReference'] ?? item.payload['referenceNumber']),
        ),
        _RequestFact('Amount', _currencyValue(item.payload['amount'])),
        _RequestFact('Counterparty', _stringValue(item.payload['counterparty'])),
        _RequestFact('Occurred at', _stringValue(item.payload['occurredAt'])),
      ]);
    default:
      return const [];
  }
}

List<_RequestFact> _compactFacts(List<_RequestFact> facts) {
  return facts.where((fact) => fact.value != null && fact.value!.isNotEmpty).toList();
}

String? _stringValue(Object? value) {
  if (value is String && value.trim().isNotEmpty) {
    return value.trim();
  }

  return null;
}

String? _currencyValue(Object? value) {
  if (value is num) {
    return 'ETB ${value.toStringAsFixed(value % 1 == 0 ? 0 : 2)}';
  }

  return null;
}

class _RequestFact {
  const _RequestFact(this.label, this.value);

  final String label;
  final String? value;
}
